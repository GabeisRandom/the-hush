'use strict';
// The Sunken Ruins in battle (region 7; game/REGIONS.md): the sand worm (kind 'worm'), «cava / cava / grab», 挖, 掘って
// (dig: no target), the desert arena (place.biome 'desert') and the sunken temple's hall ('temple'), the Great Worm (opts.boss
// 'worm': an ordinary fight with the boss theme), the bestiary's lines and drops, and the worm's voice.
//   The worm's rule: sand worms burrow. A worm that's up dives under the sand at the foes' turn (a mound is all you see; it
//   doesn't bite that round); under the sand nothing reaches it (the hit just sprays sand: flow.js land → _.ruins.buried), and
//   at the next foes' turn it bursts up and bites. So: hit it when it surfaces, or dig it out: «¡Cava!» pops every buried worm
//   up, stunned (it still bites back, but your next hit on it lands ×2: «SURPRISE ×2»); everyone else gets sand in the eyes.
//   The cycle runs in flow.js's hooks for battle skills (_.tac.begin / judge / attackers: chained, so tactics.js keeps working);
//   flow.js has two lines for it (land: c.buried; the preview: _.ruins.preview) and knows the kind (HP, KIND_EN, NEW_KINDS,
//   GIANT_ID); parser.js reads dig like call (no target). The model is _.M.build / pose's (wrapped), and BATTLE.buildFoe's
//   for the overworld (it swims through the sand, diving and surfacing). The arenas come in through stage.js _.arenaBuilders.
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || !BATTLE._.LANGS) return;
  const B = BATTLE, _ = B._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { if (L[lang]) for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };

  // ================================================================ the words: the worm, dig, their frames, tips and lines
  const TIP_WORM = w => `Sand worms burrow. Under the sand (just a moving mound) nothing reaches them: hit them when they come up, or dig them out with ${w}: every buried worm pops up stunned, and your next hit on it lands ×2.`;
  const TIP_DIG = w => `Dig (${w}): ${'Mimo'} digs up the sand in front of everyone. Buried worms pop out stunned (×2 on your next hit); everyone else gets a little sand in the eyes.`;
  put(L.es.species, 'worm', { w: 'gusano', pl: 'gusanos', g: 'm', en: 'worm' });
  put(L.es.verbs, 'dig', { show: 'cava', forms: ['cava', 'cave', 'excava', 'cávale'], en: 'dig' });      // (no voseo «cavá»: it would read «cava» as a missing accent)
  put(L.es.frames, 'digT', { text: '¡Cava!', pat: 'verb' });
  put(L.es.tips, 'worm', TIP_WORM('«¡Cava!»')); put(L.es.tips, 'dig', TIP_DIG('«cava»'));
  lines('es', { digging: ['¡Cava, cava, cava!', 'Dig, dig, dig!'], wormUnder: ['¡Está bajo la arena!', 'It’s under the sand!'], wormOut: ['¡Afuera!', 'Out you come!'],
    wormDive: ['¡Se esconde en la arena!', 'It hides in the sand!'], wormUp: ['¡Sale de la arena!', 'It comes out of the sand!'] });
  Object.assign(L.es.gloss, { gusano: 'worm', gusanos: 'worms', cava: 'dig', arena: 'sand', esconde: 'hides', afuera: 'out' });
  put(L.pt.species, 'worm', { w: 'minhoca', pl: 'minhocas', g: 'f', en: 'worm' });
  put(L.pt.verbs, 'dig', { show: 'cava', forms: ['cava', 'cave', 'cavem', 'escava'], en: 'dig' });
  put(L.pt.frames, 'digT', { text: 'Cava!', pat: 'verb' });
  put(L.pt.tips, 'worm', TIP_WORM('«Cava!»')); put(L.pt.tips, 'dig', TIP_DIG('«cava»'));
  lines('pt', { digging: ['Cava, cava, cava!', 'Dig, dig, dig!'], wormUnder: ['Está debaixo da areia!', 'It’s under the sand!'], wormOut: ['Pra fora!', 'Out you come!'],
    wormDive: ['Ela se esconde na areia!', 'It hides in the sand!'], wormUp: ['Ela sai da areia!', 'It comes out of the sand!'] });
  Object.assign(L.pt.gloss, { minhoca: 'worm', minhocas: 'worms', cava: 'dig', areia: 'sand', esconde: 'hides', fora: 'out' });
  put(L.de.species, 'worm', { w: 'Wurm', pl: 'Würmer', gen: 'Wurms', g: 'm', en: 'worm' });
  put(L.de.verbs, 'dig', { show: 'grab', forms: ['grab', 'grabe', 'grabt', 'buddel', 'buddle'], en: 'dig' });
  put(L.de.frames, 'digT', { text: 'Grab!', pat: 'verb' });
  put(L.de.tips, 'worm', '«der Wurm» is a der-word. ' + TIP_WORM('«Grab!»')); put(L.de.tips, 'dig', TIP_DIG('«grab»'));
  lines('de', { digging: ['Grab, grab, grab!', 'Dig, dig, dig!'], wormUnder: ['Er ist unter dem Sand!', 'It’s under the sand!'], wormOut: ['Raus da!', 'Out you come!'],
    wormDive: ['Er versteckt sich im Sand!', 'It hides in the sand!'], wormUp: ['Er kommt aus dem Sand!', 'It comes out of the sand!'] });
  Object.assign(L.de.gloss, { wurm: 'worm', 'würmer': 'worms', wuermer: 'worms', grab: 'dig', sand: 'sand', versteckt: 'hides', raus: 'out' });
  if (L.zh) {
    put(L.zh.species, 'worm', { w: '[沙虫|shā chóng]', en: 'worm', g: 'm', cl: '条', cls: ['条', '只'], alt: ['[虫子|chóng zi]', '[虫|chóng]'] });
    put(L.zh.verbs, 'dig', { show: '[挖|wā]', forms: ['[挖|wā]', '[挖开|wā kāi]'], en: 'dig', cj: [['[挖|wā]', 'ok'], ['[挖开|wā kāi]', 'ok', 'result'], ['[挖出来|wā chū lái]', 'ok', 'result']] });
    if (L.zh.frames) put(L.zh.frames, 'digT', { text: '[挖|wā] ！', pat: 'verb' });
    if (L.zh.tips) { put(L.zh.tips, 'worm', TIP_WORM('«[挖|wā] ！»')); put(L.zh.tips, 'dig', TIP_DIG('«[挖|wā]»')); }
    lines('zh', { digging: ['[挖|wā] ， [挖|wā] ， [挖|wā] ！', 'Dig, dig, dig!'], wormUnder: ['[它|tā] [在|zài] [沙子|shā zi] [下面|xià miàn] ！', 'It’s under the sand!'], wormOut: ['[出来|chū lái] ！', 'Out you come!'],
      wormDive: ['[它|tā] [钻进|zuān jìn] [沙子|shā zi] [里|lǐ] [了|le] ！', 'It hides in the sand!'], wormUp: ['[它|tā] [从|cóng] [沙子|shā zi] [里|lǐ] [钻|zuān] [出来|chū lái] [了|le] ！', 'It comes out of the sand!'] });
  }
  if (L.ja) {
    put(L.ja.species, 'worm', { w: 'ミミズ', en: 'worm', g: 'm', alt: ['みみず'], kata: true });
    put(L.ja.verbs, 'dig', { show: '[掘|ほ]って', forms: ['[掘|ほ]って'], en: 'dig', cj: [['[掘|ほ]って', 'te'], ['[掘|ほ]れ', 'imp'], ['[掘|ほ]る', 'dict'], ['[掘|ほ]ります', 'masu']] });
    if (L.ja.frames) put(L.ja.frames, 'digT', { text: '[掘|ほ]って ！', pat: 'verb' });
    if (L.ja.tips) { put(L.ja.tips, 'worm', TIP_WORM('«[掘|ほ]って ！»')); put(L.ja.tips, 'dig', TIP_DIG('«[掘|ほ]って»')); }
    lines('ja', { digging: ['[掘|ほ]って 、 [掘|ほ]って ！', 'Dig, dig, dig!'], wormUnder: ['[砂|すな] の [中|なか] だ ！', 'It’s under the sand!'], wormOut: ['[出|で]て きた ！', 'Out you come!'],
      wormDive: ['[砂|すな] に [隠|かく]れた ！', 'It hides in the sand!'], wormUp: ['[砂|すな] から [出|で]て きた ！', 'It comes out of the sand!'] });
  }
  ['es', 'pt', 'de'].forEach(k => { delete L[k].I; });        // (the parser indexes each language once: again, with the new words)
  if (L.zh) { delete L.zh.I; delete L.zh.CJ; } if (L.ja) { delete L.ja.I; delete L.ja.CJ; }
  // the language engine's items: v.dig is ruins.js's (one object), n.worm the creature
  const N = (id, es, pt, de, en, g, icon) => ({ id, es, pt, de, en, g, icon: icon || id.split('.')[1], battle: true });
  const dig = (typeof LEX !== 'undefined' && LEX.item('v.dig')) || Object.assign(N('v.dig', 'cava', 'cava', 'grab', 'dig', null, 'dig'), { kind: 'verb', zh: '[挖|wā]', ja: '[掘|ほ]って' });
  dig.battle = true;
  const worm = Object.assign(N('n.worm', 'gusano', 'minhoca', 'Wurm', 'worm', { es: 'm', pt: 'f', de: 'm' }, 'worm'), { zh: '[沙虫|shā chóng]', ja: 'ミミズ',
    pl: { es: 'gusanos', pt: 'minhocas', de: 'Würmer', zh: '[沙虫|shā chóng]', ja: 'ミミズ' }, alt: { ja: ['みみず'], zh: ['[虫子|chóng zi]'] } });
  if (_.ITEMS) for (const it of [dig, worm]) if (!_.ITEMS.some(x => x.id === it.id)) _.ITEMS.push(it);
  if (typeof LEX !== 'undefined') { const add = [dig, worm].filter(it => !LEX.item(it.id)); if (add.length) LEX.register(add); }
  if (_.VERB_EN && !_.VERB_EN.dig) _.VERB_EN.dig = 'dig';
  if (typeof ICONS !== 'undefined' && !ICONS.keys.includes('worm')) ICONS.add('worm', (c, p, h) => {
    h.shape(c, p, h.ell(0, 30, 36, 9), '#e2c088');
    for (let i = 0; i < 4; i++) h.shape(c, p, h.ell(-16 + i * 9, 20 - i * 13, 13 - i, 12 - i), ['#f2c94c', '#e8bd3e', '#f2c94c', '#f6d76a'][i]);
    if (p) { h.dot(c, 14, -24, 3.6, h.INK); h.dot(c, 24, -22, 3.6, h.INK); c.strokeStyle = h.INK; c.lineWidth = 2.5; c.beginPath(); c.arc(19, -15, 4, 0.2, Math.PI - 0.2); c.stroke(); }
  });
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { for (const s of [worm.zh, worm.ja, '[挖|wā] [挖开|wā kāi] [挖出来|wā chū lái] [沙子|shā zi] [下面|xià miàn] [钻进|zuān jìn] [钻|zuān] [出来|chū lái]', '[掘|ほ]って [掘|ほ]れ [掘|ほ]る [掘|ほ]ります [砂|すな] [隠|かく]れた [出|で]て']) CJK.addSource(s); } catch (e) { /* optional */ } }

  // ================================================================ the model: a felt worm rising out of a little sand mound
  // F (the foe's state) drives it: F.under (and F.underS, eased) sinks it under the floor and raises the mound; the face
  // blinks, squints when hurt, beams when happy. Big ones are a size up; giant (the boss) the stage scales.
  const M0 = _.M;
  function buildWorm(o = {}) {
    const col = M0.COLORS[o.color] || M0.COLORS.yellow, shadow = !!o.shadow;
    const base = shadow ? new THREE.Color('#4a4558') : new THREE.Color(col).lerp(new THREE.Color(M0.BASE), 0.18);
    const M = { skin: M0.feltMat(base, { lift: shadow ? '#6a6478' : col }), band: M0.feltMat(new THREE.Color(base).multiplyScalar(0.82), { lift: new THREE.Color(col).multiplyScalar(0.85) }),
      belly: M0.feltMat(new THREE.Color(base).lerp(new THREE.Color('#f6f0e6'), 0.5), { rim: 0.1, warm: 0.2 }), sand: M0.feltMat('#e2c088', { noTex: true, rim: 0.05, lift: '#e9cf98' }), pom: M0.feltMat('#f6f0e6', { rim: 0.1, noTex: true }) };
    const ink = new THREE.MeshBasicMaterial({ color: M0.INK }), white = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = TK.part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    const segs = [];
    const NS = 5;
    for (let i = 0; i < NS; i++) {
      const g = new THREE.Group(); body.add(g);
      const r = i === NS - 1 ? 0.27 : 0.22 - i * 0.008;
      g.add(P(TK.G.sphere, M.skin, [0, 0, 0], [r, r * 0.92, r], { ink: 0.018 }));
      if (i < NS - 1) g.add(P(new THREE.TorusGeometry(1, 0.12, 6, 18), M.band, [0, 0.02, 0], [r * 0.98, r * 0.98, r * 1.4], { rot: [Math.PI / 2, 0, 0], ink: 0 }));
      segs.push(g);
    }
    // the head: a face on the front, a pale belly patch, two feelers with pom tips
    const head = segs[NS - 1];
    head.add(P(TK.G.sphere, M.belly, [0, -0.06, 0.15], [0.18, 0.14, 0.12], { ink: 0.008 }));
    const face = new THREE.Group(); face.position.set(0, 0.05, 0.22); head.add(face);
    const eyes = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * 0.09, 0.03, 0.02); face.add(e); const w = new THREE.Mesh(TK.G.sphere, white); w.scale.set(0.06, 0.07, 0.03); e.add(w); const pu = new THREE.Mesh(TK.G.sphere, ink); pu.scale.set(0.034, 0.042, 0.02); pu.position.set(0, -0.005, 0.02); e.add(pu); return e; });
    const mouth = new THREE.Mesh(TK.G.sphere, ink); mouth.scale.set(0.05, 0.022, 0.012); mouth.position.set(0, -0.07, 0.03); face.add(mouth);
    const feelers = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 0.1, 0.22, 0.02); g.rotation.z = -s * 0.35; head.add(g); g.add(P(TK.G.cyl, M.band, [0, 0.08, 0], [0.018, 0.16, 0.018], { ink: 0 })); g.add(P(TK.G.sphere, M.pom, [0, 0.17, 0], [0.04, 0.04, 0.04], { ink: 0.006 })); g.userData.s = s; return g; });
    // the sand it comes out of: a ring at its foot; a mound (when it's under) that wanders a little
    const ring = P(TK.G.sphere, M.sand, [0, 0.02, 0], [0.42, 0.08, 0.42], { ink: 0.01 }); root.add(ring);
    const mound = P(TK.G.sphere, M.sand, [0, 0.0, 0], [0.5, 0.22, 0.5], { ink: 0.012 }); root.add(mound); mound.scale.set(0.001, 0.001, 0.001);
    const anchors = {};
    for (const [k, parent, pos] of [['head', head, [0, 0.1, 0.12]], ['top', head, [0, 0.42, 0]], ['mid', segs[2], [0, 0, 0.12]], ['face', face, [0, 0, 0]], ['mouth', face, [0, -0.07, 0.04]]]) { const a = new THREE.Object3D(); a.position.set(...pos); parent.add(a); anchors[k] = a; }
    const scale = o.size === 'big' ? 1.3 : 1.0;
    root.scale.setScalar(scale);
    return { kind: 'worm', root, body, M, meshes, segs, head, face, eyes, mouth, feelers, ring, mound, glows: {}, reticles: {}, anchors, scale, big: o.size === 'big', color: o.color,
      parts: [], radius: 0.4 * scale, height: 1.35 * scale, labelH: 1.45, hover: 0 };
  }
  function poseWorm(h, F, t, dt) {
    const asleep = F.states && F.states.has && F.states.has('asleep'), seed = F.seed || 0;
    F.underS = damp(F.underS || 0, F.under ? 1 : 0, F.under ? 5 : 7, dt);
    const u = F.underS, m = F.face || (asleep ? 'asleep' : F.mood), angry = m === 'go' || m === 'alert';
    // the body: an S curve rising out of the sand, swaying; it sinks into the floor when it's under
    const sway = Math.sin(t * (angry ? 4.2 : 2.2) + seed), lift = 0.12;
    h.segs.forEach((g, i) => {
      const k = i / (h.segs.length - 1);
      g.position.set(Math.sin(t * 2.2 + seed + i * 0.9) * 0.07 * k + sway * 0.04 * k, lift + i * 0.24, Math.sin(i * 0.8) * 0.06 * k + (angry ? k * 0.12 : 0));
    });
    h.head.rotation.x = -0.12 + (angry ? 0.2 : 0) + Math.sin(t * 1.6 + seed) * 0.05;
    h.body.position.y = -u * 1.45;
    h.body.scale.set(F.sx || 1, F.sy || 1, F.sx || 1);
    h.body.rotation.x = F.lean || 0; h.body.rotation.z = (F.tilt || 0) + sway * 0.04;
    h.body.visible = u < 0.97;
    // the mound: up when it's under, wandering a little; the ring round its foot when it's up
    const ms = Math.max(0.001, u);
    h.mound.scale.set(0.5 * ms, 0.24 * ms * (1 + Math.sin(t * 5 + seed) * 0.12), 0.5 * ms);
    h.mound.position.set(Math.sin(t * 1.3 + seed) * 0.12 * u, 0, Math.cos(t * 1.1 + seed) * 0.08 * u);
    h.ring.visible = u < 0.9;
    // the face: a slow blink; squints when hurt, closed asleep, wide when it's going for you
    const blink = asleep || (t + seed) % 3.4 < 0.12, hurt = m === 'hurt' || F.down;
    for (const e of h.eyes) e.scale.set(1, blink ? 0.12 : hurt ? 0.35 : m === 'happy' ? 0.55 : angry ? 1.15 : 1, 1);
    h.mouth.scale.set(0.05, angry ? 0.04 : m === 'happy' ? 0.03 : 0.022, 0.012);
    for (const f of h.feelers) f.rotation.z = -f.userData.s * (0.35 + Math.sin(t * 3 + seed + f.userData.s) * 0.15);
  }
  const kindOf0 = M0.kindOf, build0 = M0.build, pose0 = M0.pose;
  M0.kindOf = k => (/worm/.test(String(k || '')) ? 'worm' : kindOf0(k));
  M0.build = (o = {}) => (/worm/.test(String(o.kind || '')) ? buildWorm(o) : build0(o));
  M0.pose = (h, F, t, dt) => (h && h.kind === 'worm' ? poseWorm(h, F, t, dt) : pose0(h, F, t, dt));
  // the overworld's worms (main.js's roamers, the Gray Marsh's shadows): one swims through the sand, diving and surfacing
  const buildFoe0 = B.buildFoe, NOSTATE = new Set(), ASLEEP = new Set(['asleep']);
  B.buildFoe = function (kind, color, o = {}) {
    if (!/worm/.test(String(kind || ''))) return buildFoe0.call(this, kind, color, o);
    const h = buildWorm({ color: M0.COLORS[color] ? color : 'yellow', size: o.size === 'big' ? 'big' : 'small', shadow: o.shadow });
    if (o.giant) { const k = +o.giant || 2; h.root.scale.multiplyScalar(k); }
    const g = new THREE.Group(); g.add(h.root);
    const F = { states: NOSTATE, mood: 'idle', face: null, sx: 1, sy: 1, tilt: 0, lean: 0, seed: Math.random() * 10, under: false, underS: 0, alive: true };
    g.userData.mood = o.mood || 'idle';
    g.userData.hush = { kind: 'worm', color, size: o.size || 'small', model: h, state: F };
    g.userData.animate = (dt, t, speed = 0) => {
      const md = g.userData.mood;
      F.states = md === 'asleep' ? ASLEEP : NOSTATE; F.mood = md === 'alert' ? 'go' : md === 'happy' ? 'happy' : 'idle';
      F.under = speed > 0.1 ? Math.sin(t * 2.6 + F.seed) > 0.35 : false;
      poseWorm(h, F, t, dt);
    };
    return g;
  };

  // ================================================================ the arenas: the desert canyon, and the temple's sunken hall
  _.arenaBuilders = _.arenaBuilders || {};
  _.arenaBuilders.desert = K => buildSand(K, false);
  _.arenaBuilders.temple = K => buildSand(K, true);
  function stainMat(uni, key) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    m.customProgramCacheKey = () => key;
    return m;
  }
  function buildSand(K, temple) {
    const P = temple
      ? { fog: '#33251f', hemiSky: '#ffd9a6', hemiGround: '#5a4030', sun: '#ffe2b8', hemiI: 0.62, sunI: 0.5, sandA: '#c9a46a', sandB: '#b8915a', rock: ['#a87850', '#946640', '#b98a5a'] }
      : { fog: '#e6cfae', skyTop: [0.36, 0.58, 0.84], skyHor: [0.93, 0.84, 0.7], hemiSky: '#fff4e6', hemiGround: '#9a6a44', sun: '#fff0d6', hemiI: 0.6, sunI: 0.7,
        sandA: '#d9bb88', sandB: '#c9a674', rock: ['#c8643c', '#d9834f', '#b4532f', '#e3a76c', '#c96f45'] };
    const { merge, M4, toon, glowTex } = TK, G = TK.G;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, temple ? 16 : K.FOG_NEAR, temple ? 52 : K.FOG_FAR);
    scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI); scene.add(hemi);
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(temple ? 3 : 8, 17, temple ? 6 : 8); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    if (!temple && K.makeSky) scene.add(K.makeSky(P));
    const R = rng(temple ? 717 : 707), c = new THREE.Color(), A = new THREE.Color(P.sandA), Bc = new THREE.Color(P.sandB);
    // the floor: sand in ripples, rising into dunes (outdoors) past the fight
    const size = temple ? 44 : 110, geo = new THREE.PlaneGeometry(size, size, temple ? 80 : 120, temple ? 80 : 120); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      p.setY(i, temple ? 0 : K.groundH(x, z) * 0.7 + Math.sin(x * 0.3 + z * 0.12) * 0.25 * smoothstep(8, 20, r));
      c.copy(A).lerp(Bc, 0.5 + 0.5 * Math.sin(x * 1.3 + Math.sin(z * 0.6) * 2.2));
      if (!temple) c.multiplyScalar(0.94 + 0.06 * Math.sin(r * 2.4));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, stainMat(uni, temple ? 'temple-floor' : 'desert-floor')); floor.receiveShadow = true; scene.add(floor);
    const pcs = [];
    if (!temple) {
      // red mesas and hoodoos all round, never between the camera and the fight
      for (let n = 0, tries = 0; n < 26 && tries < 3000; tries++) {
        const a = R() * TAU, r = 16 + R() * 24, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (z > -4 || (z > -10 && Math.abs(x) < 14)) continue;          // (behind the fight only: never beside or over the camera)
        const y = K.groundH(x, z) * 0.7 - 0.4, hgt = 2 + R() * (r > 24 ? 9 : 4), rad = 1.2 + R() * 2.2;
        let yy = y;
        for (let k = 0; yy < y + hgt; k++) { const hh = 0.9 + R() * 1.4, rr = rad * (1 - k * 0.07); pcs.push({ geo: G.cyl, m: M4(x, yy + hh / 2, z, rr, hh, rr * (0.85 + R() * 0.3), R() * 3), color: P.rock[(k + n) % P.rock.length] }); yy += hh; }
        pcs.push({ geo: G.sphere, m: M4(x, yy, z, rad * 0.9, 0.35, rad * 0.8), color: '#a9492c' });
        n++;
      }
      // broken columns and a palm or two
      for (const [x, z, h] of [[-7.5, -6.5, 2.2], [-5.8, -7.6, 1.2], [8.6, -5.8, 2.8], [10.2, -3.4, 1.0]]) { pcs.push({ geo: G.cyl, m: M4(x, h / 2, z, 0.38, h, 0.38), color: '#e3b98a' }, { geo: G.box, m: M4(x, 0.12, z, 0.95, 0.24, 0.95), color: '#c99a68' }); }
      for (const [x, z] of [[-11.5, -9.0], [12.5, -10.5]]) {
        for (let i = 0; i < 5; i++) pcs.push({ geo: G.cyl, m: M4(x + i * 0.08, 0.5 + i * 0.9, z, 0.18 - i * 0.015, 0.95, 0.18 - i * 0.015), color: i % 2 ? '#9a7048' : '#8a6040' });
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; pcs.push({ geo: G.sphere, m: M4(x + 0.4 + Math.cos(a) * 1.0, 4.7, z + Math.sin(a) * 1.0, 1.2, 0.09, 0.3, -a, 0, 0.35), color: i % 2 ? '#5fae4f' : '#4f9a45' }); }
      }
    } else {
      // the hall: sandstone walls in a ring (facing in), columns, the bell above in the dark, braziers
      const HR = 15, HH = 10;
      const wg = new THREE.CylinderGeometry(HR, HR + 0.8, HH, 64, 6, true); wg.translate(0, HH / 2 - 0.3, -1);
      const wp = wg.attributes.position, wc = new Float32Array(wp.count * 3), W1 = new THREE.Color('#b8844e'), W2 = new THREE.Color('#d9a46a');
      for (let i = 0; i < wp.count; i++) { const y = wp.getY(i), a = Math.atan2(wp.getZ(i) + 1, wp.getX(i)); c.copy(W1).lerp(W2, 0.5 + 0.5 * Math.sin(y * 1.6 + Math.sin(a * 9) * 0.6)).multiplyScalar(0.62 + 0.38 * smoothstep(0, 6, y)); wc.set([c.r, c.g, c.b], i * 3); }
      wg.setAttribute('color', new THREE.BufferAttribute(wc, 3));
      const wall = new THREE.Mesh(wg, new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, side: THREE.BackSide })); wall.receiveShadow = true; scene.add(wall);
      const ceil = new THREE.Mesh(new THREE.CircleGeometry(HR + 1, 40).rotateX(Math.PI / 2), toon('#2a1f1a', { rim: 0 })); ceil.position.set(0, HH - 0.3, -1); scene.add(ceil);
      for (const a of [-2.6, -2.0, -1.4, -0.8, -0.2, 2.9, 3.5]) { const x = Math.cos(a) * (HR - 1.4), z = Math.sin(a) * (HR - 1.4) - 1; pcs.push({ geo: G.cyl, m: M4(x, HH / 2 - 0.3, z, 0.55, HH, 0.55), color: '#c99a68' }, { geo: G.box, m: M4(x, 0.2, z, 1.4, 0.4, 1.4), color: '#a87850' }); }
      for (let i = 0; i < 24; i++) { const a = R() * TAU, d = HR - 1 - R() * 3; if (Math.sin(a) > 0.45) continue; pcs.push({ geo: G.sphere, m: M4(Math.cos(a) * d, 0.1, Math.sin(a) * d - 1, 0.8 + R(), 0.35 + R() * 0.3, 0.7 + R() * 0.6), color: '#c9a46a' }); }
      // the bell, high in the dark at the back
      pcs.push({ geo: G.box, m: M4(0, HH - 1.2, -9, 4.0, 0.35, 0.45), color: '#5a3a24' });
      const bell = new THREE.Mesh(new THREE.LatheGeometry([[0.9, -1.9], [0.86, -1.75], [0.58, -1.15], [0.44, -0.4], [0.25, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 22), toon('#8f8c9a', { rim: 0.2 }));
      bell.position.set(0, HH - 1.35, -9); scene.add(bell);
      for (const [x, z] of [[-6.5, -5.5], [7.0, -5.0]]) {
        pcs.push({ geo: G.cyl, m: M4(x, 0.6, z, 0.3, 1.2, 0.3), color: '#5a4a3a' }, { geo: G.cyl, m: M4(x, 1.25, z, 0.5, 0.2, 0.5), color: '#3a3030' });
        const l = new THREE.PointLight('#ffb35a', 0.9, 14, 1.4); l.position.set(x, 2.0, z); scene.add(l);
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc46b', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); gl.position.set(x, 1.6, z); gl.scale.setScalar(1.6); scene.add(gl);
      }
    }
    if (pcs.length) { const rocks = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.14 })); rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks); }
    // sand blowing across (outdoors) or dust in the dark (the hall)
    const motes = [];
    for (let i = 0; i < 18; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: temple ? '#ffd9a6' : '#fff3d6', transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(temple ? 0.12 : 0.18); scene.add(s); motes.push({ s, x: -10 + R() * 20, z: -8 + R() * 10, y: 0.3 + R() * (temple ? 5 : 2.5), ph: R() * TAU, sp: 0.4 + R() * 0.5 }); }
    function update(t, dt) {
      uni.uTime.value = t;
      for (const m of motes) {
        if (temple) m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 0.8, m.y + Math.sin(t * m.sp * 0.7 + m.ph) * 0.4, m.z);
        else m.s.position.set(((m.x + t * m.sp * 3 + 14) % 28) - 14, m.y + Math.sin(t * 2 + m.ph) * 0.2, m.z);
        m.s.material.opacity = 0.25 + 0.15 * Math.sin(t * 1.5 + m.ph);
      }
    }
    return { scene, sun, uni, update, P, desert: !temple, temple };
  }

  // ================================================================ the fight: the worms' cycle, the buried miss, dig
  const F = () => _.flow;
  const isWorm = f => f && f.species === 'worm' && f.alive && !f.gone && !f.calmed;
  // a hit on a worm under the sand: it only sprays sand (the grade still counts), and the first time the tip says what to do
  function buried(c, p) {
    const K = F(), G = K.G, f = c.target, ST = K.ST, UI = K.UI;
    K.setMood(K.A.mimo, 'confused', 1.2);
    G.hitstop = 0.04; ST.shake(0.18, 0.2);
    ST.S.fx.puff(f.x, 0.15, f.z, 10, 0.26, '#e2c088');
    UI.pop(ST.worldOf(f, 'top').clone().add(new THREE.Vector3(0.45, -0.6, 0)), 'MISS', G.t, { color: '#f4e3c4', size: 36, sub: 'under the sand', dx: 0.25 });
    if (K.showGrade) K.showGrade(f);
    G.stats.buried = (G.stats.buried || 0) + 1;
    K.emit('block', { foe: f, kind: 'sand' });
    const [t, en] = K.line('wormUnder'); K.say(f, t, { cls: 'foe small', en, dur: 1.6 });
    if (!G.wormTipped && G.L.tips.worm) { G.wormTipped = true; UI.tip(G.L.tips.worm); }
  }
  // the preview line for dig, and for a worm under the sand
  function preview(c) {
    const K = F(), G = K.G;
    if (c.verb === 'dig') {
      const any = K.targetable().some(f => f.species === 'worm' && f.under);
      return `dig → everyone <span class="bonus">${any ? 'buried worms pop out dizzy' : 'sand in their eyes'}</span>`;
    }
    const f = c.target;
    if (f && f.species === 'worm' && f.under) return `${K.knows && K.knows('v.dig') ? '' : ''}${c.verb} → the worm <span class="warn">under the sand: it misses!${K.knows && K.knows('v.dig') ? ` «${UI_esc(K.showWord('v.dig'))}» it out first` : ' Wait till it comes up'}</span>`;
    return null;
  }
  const UI_esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  _.ruins = Object.assign(_.ruins || {}, { buried, preview });
  // dig: Mimo paws at the sand in front of everyone. Buried worms pop out dizzy (×2 on the next hit); the rest get sand in their eyes
  async function actDig(c) {
    const K = F(), G = K.G, A = K.A, ST = K.ST, UI = K.UI, M = A.mimo;
    const foes = K.targetable().filter(f => !f.shy);
    K.setMood(M, 'perk', 1.6);
    ST.shot('wide');
    const [t0, en0] = K.line('digging'); K.say(M, t0, { cls: 'mimo', en: en0, dur: 1.6 });
    K.emit('dig');
    const T = G.t + 0.7, gp = K.timingWindow(T, 'Space', () => ST.worldOf(M, 'top'));
    for (let k = 0; k < 4; k++) {
      K.tween(M, { sy: 0.8, sx: 1.16 }, 0.07).then(() => K.tween(M, { sy: 1, sx: 1 }, 0.09));
      const p = ST.worldOf(M, 'mid'); ST.S.fx.puff(p.x + 0.35, 0.12, p.z + (Math.random() - 0.5) * 0.4, 3, 0.18, '#e2c088', 0.5);
      await K.wait(0.16);
    }
    const grade = await gp;
    let first = true, out = 0;
    for (const f of foes) {
      if (!f.alive || f.gone) continue;
      const p = ST.worldOf(f, 'mid');
      const cc = Object.assign({}, c, { target: f, crit: false, weakHit: false, sneak: false, armored: false, curled: false, belly: false, open: false, bounce: false, flip: false, clang: false, behind: false, buried: false, through: false, partKey: null });
      if (f.species === 'worm' && f.under) {
        f.under = false; f.dugOut = true; f.wormStun = true; out++;          // (up and stunned: your next hit lands ×2; it doesn't sit the round out, though)
        ST.S.fx.puff(f.x, 0.15, f.z, 14, 0.32, '#e2c088'); ST.shake(0.24, 0.3); K.emit('jump');
        UI.pop(ST.worldOf(f, 'top'), 'DUG OUT!', G.t, { color: '#ffd166', size: 34, sub: 'stunned: ×2 next hit', rise: 0.5, life: 1.5 });
        await K.wait(0.4);
        if (!first) G.badgePending = null;
        await K.land(cc, 0.6, grade, ST.worldOf(f, 'mid'), false, { knock: 0.15 });
      } else {
        ST.S.fx.puff(p.x, p.y, p.z, 6, 0.2, '#e2c088');
        if (!first) G.badgePending = null;
        await K.land(cc, 0.45, grade, p, false, { knock: 0.12 });
      }
      first = false;
      await K.wait(0.06);
    }
    if (out) { const [t, en] = K.line('wormOut'); K.say(M, t, { cls: 'mimo small', en, dur: 1.4 }); }
    if (!G.digTipped && G.L.tips.dig) { G.digTipped = true; UI.tip(G.L.tips.dig); }
    K.refreshLabels(); K.setMood(M, 'idle');
  }
  if (_.MOVES && !_.MOVES.dig) _.MOVES.dig = c => actDig(c);
  // (the example a command box shows for dig, if flow.js's own list doesn't have it: «¡Cava!», no target)
  if (_.P && _.P.sayAction && _.flow && _.flow.showWord) {
    const sa0 = _.P.sayAction;
    _.P.sayAction = (Lx, verb, f, o) => (verb === 'dig' ? _.P.wrapS(Lx, _.flow.showWord('v.dig')) : sa0(Lx, verb, f, o));
  }
  // the cycle, in flow.js's hooks for battle skills: battle/tactics.js's hook lists (judgeHooks, beginHooks) when it's loaded,
  // else wrapping _.tac's own; _.tac.attackers is a single hook, so it's chained
  function judgeHook(r) {
    for (const c of (r && r.clauses) || []) {
      const f = c.target; if (!f || f.species !== 'worm' || c.verb === 'dig') continue;
      if (f.under) c.buried = true;
      else if (f.wormStun) c.sneak = true;           // (dug out and dizzy: ×2, «SURPRISE ×2»)
    }
  }
  function beginHook() {
    const G = F() && F().G; if (!G) return;
    G.wormTipped = G.digTipped = false;
    for (const f of G.foes || []) if (f.species === 'worm') { f.under = false; f.underS = 0; f.wormStun = false; f.dugOut = false; }
  }
  function install() {
    const T = (_.tac = _.tac || {});
    if (T.ruinsOn && T.attackers && T.attackers.ruins) return;
    if (!T.ruinsOn) {
      if (Array.isArray(T.judgeHooks)) T.judgeHooks.push(judgeHook); else { const j0 = T.judge; T.judge = r => { if (j0) j0(r); judgeHook(r); }; }
      if (Array.isArray(T.beginHooks)) T.beginHooks.push(beginHook); else { const b0 = T.begin; T.begin = o => { if (b0) b0(o); beginHook(o); }; }
      T.ruinsOn = true;
    }
    const attackers0 = T.attackers;
    T.attackers = async function (list) {
      if (attackers0) list = await attackers0.call(this, list);
      const K = F(), G = K.G, ST = K.ST;
      const worms = (G.foes || []).filter(isWorm);
      if (!worms.length) return list;
      let out = list.slice(), dove = 0, rose = 0;
      for (const f of worms) {
        if (f.dugOut) { f.dugOut = false; continue; }                 // (dug out this round: it stays up and bites back, still stunned: your next hit lands ×2)
        f.wormStun = false;
        if (f.down || f.flipped) continue;
        if (f.under) {
          if (!out.includes(f)) continue;                               // (not its turn: it stays down there)
          f.under = false; rose++;                                      // it bursts up out of the sand, and bites (flow.js foeAttack)
          ST.S.fx.puff(f.x, 0.15, f.z, 12, 0.3, '#e2c088'); ST.shake(f.spec && f.spec.giant ? 0.5 : 0.22, 0.35); K.emit('jump');
          const [t, en] = K.line('wormUp'); K.say(f, t, { cls: 'foe small', en, dur: 1.3 });
          await K.wait(0.45);
        } else {
          out = out.filter(x => x !== f);                               // up: it dives instead of biting
          f.under = true; dove++;
          ST.S.fx.puff(f.x, 0.12, f.z, 10, 0.28, '#e2c088'); if (f.spec && f.spec.giant) ST.shake(0.4, 0.4);
          if (dove === 1) { const [t, en] = K.line('wormDive'); K.say(f, t, { cls: 'foe small', en, dur: 1.4 }); }
          await K.wait(0.3);
        }
      }
      if (dove && !G.wormTipped && G.L.tips.worm) { G.wormTipped = true; K.UI.tip(G.L.tips.worm); }
      if (dove || rose) K.refreshLabels();
      return out;
    };
    T.attackers.ruins = true;
  }
  install();
  { const start0 = B.start; B.start = function (opts) { install(); return start0.call(this, opts); }; }      // (in case tactics.js arrives later)

  // ================================================================ the bestiary's lines, drops, and the worm's voice
  const RW = _.RW;
  if (RW) {
    if (RW.DROPS && !RW.DROPS.worm) RW.DROPS.worm = [['w.orange', 0.25]];
    if (RW.BOSS_DROPS && !RW.BOSS_DROPS.worm) RW.BOSS_DROPS.worm = ['w.cake', 'w.orange'];
    if (RW.KIND_EN && !RW.KIND_EN.worm) RW.KIND_EN.worm = 'sand worm';
    if (RW.LORE) {
      if (!RW.LORE.worm) RW.LORE.worm = ['El gusano de arena se esconde bajo la arena.', 'A minhoca de areia se esconde debaixo da areia.', 'Der Sandwurm versteckt sich unter dem Sand.',
        '[沙虫|shā chóng] [躲|duǒ] [在|zài] [沙子|shā zi] [下面|xià miàn] 。', 'ミミズ は [砂|すな] の [下|した] に [隠|かく]れる 。', 'The sand worm hides under the sand.'];
      if (!RW.LORE['boss:worm']) RW.LORE['boss:worm'] = ['El Gran Gusano dormía junto a la campana del templo. Bajo la arena nadie lo podía tocar.', 'A Minhocona dormia ao lado do sino do templo. Debaixo da areia, ninguém conseguia tocá-la.',
        'Der Riesenwurm schlief neben der Glocke des Tempels. Unter dem Sand konnte ihn niemand berühren.',
        '[大沙虫|dà shā chóng] [睡|shuì] [在|zài] [神庙|shén miào] [的|de] [钟|zhōng] [旁边|páng biān] 。 [在|zài] [沙子|shā zi] [下面|xià miàn] ， [谁|shéi] [也|yě] [碰|pèng] [不|bú] [到|dào] [它|tā] 。',
        '[大|おお]ミミズ は [神殿|しんでん] の [鐘|かね] の そば で [眠|ねむ]って いた 。 [砂|すな] の [下|した] で は 、 だれ も さわれ なかった 。', 'The Great Worm slept by the temple’s bell. Under the sand, nobody could touch it.'];
    }
  }
  if (typeof BFX !== 'undefined' && BFX.VOICES && !BFX.VOICES.worm) BFX.VOICES.worm = { m: 58, vow: ['o', 'u', 'o'], len: 0.1, gap: 0.035, layer: 'snort' };
  Object.assign(_.ruins, { buildWorm, poseWorm, actDig, install });
})();
