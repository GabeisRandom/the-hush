'use strict';
// The Future's fights (battle/*: opts.realm 'future'; the time mechanic itself, battle idea G, is battle/'s): the arena, gray Alba
// tomorrow (place.biome 'future', through stage.js's _.arenaBuilders), and the Great Silence's bestiary line and drops
// (opts.boss 'silence', a giant white hushling: rewards.js keys it 'boss:hushbig').
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._) return;
  const _ = BATTLE._;

  // ---------------------------------------------------------------- the arena: the plaza tomorrow
  _.arenaBuilders = _.arenaBuilders || {};
  _.arenaBuilders.future = K => buildFuture(K);
  function stainMat(uni) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 8.0, distance(vWPos.xz, uStainC)));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.95, 0.93, 1.12) + vec3(0.05, 0.05, 0.08);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.6);');
    };
    m.customProgramCacheKey = () => 'future-floor';
    return m;
  }
  function buildFuture(K) {
    const P = { fog: '#a9a6b4', skyTop: [0.55, 0.56, 0.64], skyHor: [0.78, 0.77, 0.82], hemiSky: '#e8e6f2', hemiGround: '#6c6878', sun: '#f2eef8', hemiI: 0.62, sunI: 0.52 };
    const { merge, M4, toon, glowTex } = TK, G = TK.G;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, K.FOG_NEAR * 0.75, K.FOG_FAR * 0.8);
    scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(6, 16, 9); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    if (K.makeSky) scene.add(K.makeSky(P));
    const R = rng(2088), c = new THREE.Color();
    // the floor: worn gray cobbles, weeds in the cracks, rising into the town's edge past the fight
    const size = 100, geo = new THREE.PlaneGeometry(size, size, 110, 110); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), A = new THREE.Color('#9d98a0'), Bc = new THREE.Color('#87828e'), W = new THREE.Color('#6f7a5c');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      p.setY(i, K.groundH(x, z) * 0.55);
      const cob = (Math.sin(x * 2.1) * Math.sin(z * 2.3) > 0.2) ? 1 : 0;
      c.copy(A).lerp(Bc, cob * 0.6 + 0.2 * Math.sin(x * 0.7 + z * 0.4)).lerp(W, smoothstep(0.82, 0.98, Math.sin(x * 3.7 + z * 1.9) * Math.cos(z * 2.9 - x)) * 0.7);
      c.multiplyScalar(0.95 + 0.05 * Math.sin(r * 1.7));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, stainMat(uni)); floor.receiveShadow = true; scene.add(floor);
    const pcs = [], add = (g, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) => pcs.push({ geo: g, m: M4(x, y, z, sx, sy, sz, ry, rx, rz), color });
    // behind the fight (never between the camera and it): the bell tower with its cracked bell, the dry fountain, houses
    { const x = 0.5, z = -15, y = K.groundH(x, z) * 0.55;
      add(G.box, x, y + 5, z, 3.6, 10, 3.6, '#c9c0b0'); add(G.box, x, y + 10.4, z, 4.2, 0.4, 4.2, '#a8a094');
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(G.box, x + sx * 1.5, y + 11.7, z + sz * 1.5, 0.5, 2.4, 0.5, '#c9c0b0');
      add(G.cone, x, y + 14.4, z, 3.1, 3.4, 3.1, '#8f5a4c', Math.PI / 4); add(G.cyl, x, y + 7.2, z + 1.85, 0.95, 0.06, 0.95, '#d8d0c0', 0, Math.PI / 2);
      for (let k = 0; k < 10; k++) add(G.cyl, x + (k % 2 ? -1.82 : 1.82), y + 1.5 + k * 0.9, z + 1.82, 0.05, 1.2, 0.05, '#556349', 0, (R() - 0.5) * 0.3, (R() - 0.5) * 0.3); }
    { const x = -6.5, z = -7.5, y = K.groundH(x, z) * 0.55; add(G.cyl, x, y + 0.35, z, 2.2, 0.7, 2.2, '#a59f98'); add(G.cyl, x, y + 0.72, z, 1.9, 0.06, 1.9, '#6d6a66'); add(G.cyl, x, y + 1.4, z, 0.3, 1.4, 0.3, '#a59f98'); add(G.cyl, x, y + 2.1, z, 0.9, 0.18, 0.9, '#a59f98');
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; add(G.sphere, x + Math.cos(a) * 2.15, y + 0.72, z + Math.sin(a) * 2.15, 0.35, 0.14, 0.3, i % 2 ? '#5f6b52' : '#6a7459'); } }
    for (const [x, z, w, h, ry] of [[-14, -12, 6, 6, 0.3], [12, -13, 7, 5, -0.25], [-19, -3, 5, 5, 1.2], [18, -4, 6, 6, -1.1]]) {
      const y = K.groundH(x, z) * 0.55; add(G.box, x, y + h / 2, z, w, h, 4.5, '#c8bfb2', ry); add(G.cone, x, y + h + 1.2, z, w * 0.75, 2.4, 3.4, '#8a5a4e', ry + Math.PI / 4);
      for (let k = 0; k < 6; k++) add(G.ico0 || G.ico1, x + (R() - 0.5) * w, y + 0.6 + R() * (h - 1), z + 2.3, 0.4 + R() * 0.3, 0.6 + R() * 0.4, 0.15, '#4f5e45', ry, R(), R());
    }
    // rubble and weeds round the edge of the fight
    for (let i = 0; i < 30; i++) { const a = R() * TAU, r = 8 + R() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > -2 && Math.abs(x) < 9) continue; const y = K.groundH(x, z) * 0.55; add(G.box, x, y + 0.15, z, 0.4 + R() * 0.6, 0.3, 0.3 + R() * 0.5, '#8d877e', R() * 3, 0, (R() - 0.5) * 0.4); for (let k = 0; k < 3; k++) add(G.cone, x + (R() - 0.5) * 0.6, y + 0.25, z + (R() - 0.5) * 0.6, 0.06, 0.5, 0.06, '#6f7a58', 0, (R() - 0.5) * 0.6, (R() - 0.5) * 0.6); }
    // dead trees
    for (const [x, z] of [[-10, -16], [9, -18], [-16, 6], [15, 7]]) { const y = K.groundH(x, z) * 0.55; add(G.cyl, x, y + 1.6, z, 0.22, 3.2, 0.22, '#5a4e46'); for (let k = 0; k < 4; k++) add(G.cyl, x + Math.cos(k * 1.7) * 0.6, y + 2.8 + k * 0.3, z + Math.sin(k * 1.7) * 0.6, 0.06, 1.5, 0.06, '#5a4e46', k * 1.7, 0.8, 0); }
    const rocks = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.12 })); rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
    // the cracked bell, high on the tower, and gray motes drifting
    const bell = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.05], [0.3, 0], [0.42, -0.4], [0.6, -0.9], [0.75, -1.05], [0, -1.05]].map(([x, y]) => new THREE.Vector2(x, y)), 20), toon('#8d8577', { rim: 0.15 }));
    bell.position.set(0.5, K.groundH(0.5, -15) * 0.55 + 12.6, -15); bell.rotation.z = 0.15; scene.add(bell);
    const motes = [];
    for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#c8c4d6', transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.22); scene.add(s); motes.push({ s, x: -12 + R() * 24, z: -10 + R() * 12, y: 0.4 + R() * 4, ph: R() * TAU, sp: 0.2 + R() * 0.4 }); }
    function update(t) {
      uni.uTime.value = t;
      bell.rotation.z = 0.15 + Math.sin(t * 0.6) * 0.02;
      for (const m of motes) { m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 1.2, m.y + Math.sin(t * m.sp * 0.8 + m.ph) * 0.5, m.z); m.s.material.opacity = 0.35 + 0.2 * Math.sin(t * 1.2 + m.ph); }
    }
    return { scene, sun, uni, update, P, future: true };
  }

  // ---------------------------------------------------------------- the Great Silence: its bestiary line and drops
  const RW = _.RW;
  if (RW && RW.LORE && !RW.LORE['boss:hushbig']) RW.LORE['boss:hushbig'] = ['El Gran Silencio es todo lo que nadie dijo… hecho enorme.', 'O Grande Silêncio é tudo o que ninguém disse… enorme.', 'Die Große Stille ist alles, was niemand gesagt hat… riesig geworden.',
    '[大寂静|Dà Jì jìng] [是|shì] [没有|méi yǒu] [人|rén] [说出|shuō chū] [的|de] [话|huà] … [变|biàn] [得|de] [巨大|jù dà] 。', '[大静寂|だいせいじゃく] は 、 だれ も [言|い]わなかった [言葉|ことば] … それ が [大|おお]きく なった もの 。', 'The Great Silence is everything nobody said… grown huge.'];
  if (RW && RW.BOSS_DROPS && !RW.BOSS_DROPS.silence) RW.BOSS_DROPS.silence = ['w.bread', 'w.cake'];
})();
