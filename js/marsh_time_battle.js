'use strict';
// The Gray Marsh in battle, long ago and tomorrow: two arenas through stage.js's _.arenaBuilders (like ruins_time_battle.js).
//   'lanternlake' (long ago): a grassy bank of the clear lake in the early morning, the water behind the fight with last night's paper
//     lanterns adrift on it, weeping willows, reeds and irises, the Lantern House on Candil's island across the water, the Old Tower on
//     its crag far off with a ribbon of gray going up to it. The Lantern Moth is fought here (it comes down off the lantern room), and so
//     is any fight of then that names no place (TIME.land's arena), and the Lantern House's ambush.
//   'stonewood' (tomorrow): a floor of cracked gray stone in a forest turned to stone (stone trunks, stone reeds, stone stumps, a fossil
//     fish in the dry bed), the chapel's belfry behind, gray dust hanging in the air, a low gray sky. The Stone Gargoyle comes down here off
//     the belfry, and so does the Stone Chapel's ambush and any fight of tomorrow's marsh (TIME.land's arena).
// Everyone stands at y 0, so a fight here needs no perches.
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || typeof TK === 'undefined') return;
  const _ = BATTLE._;
  const PAL = {
    lanternlake: { fog: '#e9e4d2', skyTop: [0.42, 0.62, 0.84], skyHor: [0.95, 0.9, 0.8], hemiSky: '#fff6e4', hemiGround: '#5f7a4a', sun: '#fff0d6', hemiI: 0.72, sunI: 0.7,
      water: ['#3f8fa8', '#6fb8c8', '#eaf8fa'], grass: ['#5f9a46', '#6aa84a', '#58924a', '#74b052'], rock: ['#8f8a80', '#9a958a', '#857f75', '#a8a39a'], green: '#6f9a48' },
    stonewood: { fog: '#b4b2ae', skyTop: [0.52, 0.53, 0.56], skyHor: [0.78, 0.77, 0.75], hemiSky: '#e2e0dc', hemiGround: '#5a5856', sun: '#f0eee8', hemiI: 0.6, sunI: 0.46,
      stone: ['#8d8a84', '#9a968e', '#837f78', '#a39f97'], rock: ['#7d7a74', '#8a8780', '#6f6c66', '#96928a'], green: '#7a7a72' },
  };
  _.arenaBuilders = _.arenaBuilders || {};
  _.arenaBuilders.lanternlake = K => build(K, 'lanternlake');
  _.arenaBuilders.stonewood = K => build(K, 'stonewood');

  // a floor material: vertex-colored toon, grayed by the Hush around the foes (as the other arenas' floors)
  function stainMat(uni, key) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    m.customProgramCacheKey = () => 'marsh-floor-' + key;
    return m;
  }
  function rod(a, b, r, color) {
    const G = TK.G, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    return { geo: G.cyl, m: new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(r, len, r)), color };
  }
  // still water: a flat sheet with slow bands of light (the clear lake barely moves)
  function waterMesh(P, uni, y, w, d, cx, cz, FN, FF) {
    return new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: uni.uTime, uA: { value: new THREE.Color(P.water[0]) }, uB: { value: new THREE.Color(P.water[1]) }, uF: { value: new THREE.Color(P.water[2]) }, uFog: { value: new THREE.Color(P.fog) }, uFogNear: { value: FN }, uFogFar: { value: FF } },
      vertexShader: 'varying vec3 vW; varying float vFogD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uTime, uFogNear, uFogFar; uniform vec3 uA, uB, uF, uFog; varying vec3 vW; varying float vFogD;
        void main(){
          vec2 p = vW.xz;
          float s1 = sin(p.x * 0.5 + uTime * 0.25 + sin(p.y * 0.4) * 1.4), s2 = sin(p.y * 0.9 - uTime * 0.18 + sin(p.x * 0.3) * 1.1);
          vec3 col = mix(uA, uB, 0.5 + 0.25 * s1 + 0.15 * s2);
          col = mix(col, uF, smoothstep(0.9, 0.98, s1 * 0.5 + s2 * 0.5) * 0.4);
          col = mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD));
          gl_FragColor = vec4(col, 0.9);
        }`,
      transparent: true, depthWrite: false })).translateX(cx).translateZ(cz).translateY(y);
  }
  // a weeping willow (a trunk, branches, long hanging strands), green long ago
  function willow(pr, x, z, h, R) {
    const G = TK.G, M4 = TK.M4;
    pr.push(rod([x, 0, z], [x + (R() - 0.5) * 0.4, h, z], 0.3, '#6b5236'));
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + R(), bx = x + Math.cos(a) * 1.8, bz = z + Math.sin(a) * 1.8, by = h + 0.4 + R() * 0.6; pr.push(rod([x, h - 0.3, z], [bx, by, bz], 0.09, '#6b5236')); for (let j = 0; j < 4; j++) pr.push({ geo: G.cone, m: M4(bx + Math.cos(a + j) * 0.3, by - 1.1, bz + Math.sin(a + j) * 0.3, 0.16, -2.2, 0.16), color: (i + j) % 2 ? '#7cb85a' : '#6aa84a' }); }
  }
  // a tree of stone: a gray trunk, a few stiff branches, no leaves
  function stoneTree(pr, x, z, h, R) {
    pr.push(rod([x, 0, z], [x + (R() - 0.5) * 0.5, h, z + (R() - 0.5) * 0.5], 0.32, '#8d8a84'));
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + R(), y0 = h * (0.5 + R() * 0.4); pr.push(rod([x, y0, z], [x + Math.cos(a) * (1.2 + R()), y0 + 0.9 + R() * 0.6, z + Math.sin(a) * (1.2 + R())], 0.1, i % 2 ? '#9a968e' : '#837f78')); }
  }

  function build(K, kind) {
    const P = PAL[kind], FN = 22, FF = 96, { merge, M4, toon, glowTex } = TK, G = TK.G;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, FN, FF);
    scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(7, 16, 9); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    if (K && K.makeSky) scene.add(K.makeSky(P));
    const R = rng(kind === 'stonewood' ? 8311 : 8307);
    const floor = [], pr = [], far = [];
    const stone = kind === 'stonewood';

    if (!stone) {
      // ---------------------------------------------------------- long ago: the lake's grassy bank, the clear water behind the fight
      const g0 = new THREE.Color(P.grass[0]), g1 = new THREE.Color(P.grass[3]), gc = new THREE.Color();
      for (let x = -26; x < 26; x += 2.0) for (let z = -6.0; z < 18; z += 2.0) {
        const n = 0.5 + 0.5 * Math.sin(x * 0.21 + Math.cos(z * 0.17) * 1.6) * Math.cos(z * 0.23 - 0.4);
        floor.push({ geo: G.box, m: M4(x + 1.0, -0.12, z + 1.0, 2.02, 0.24, 2.02), color: '#' + gc.copy(g0).lerp(g1, n).getHexString() });
      }
      for (let x = -26; x < 26; x += 1.6) floor.push({ geo: G.box, m: M4(x + 0.8, -0.32, -6.4, 1.62, 0.5, 0.9, 0.05 * Math.sin(x)), color: '#8a7a5a' });
      for (let i = 0; i < 140; i++) { const x = -24 + R() * 48, z = -5.4 + R() * 22; if (Math.abs(x) < 10 && z < 4.5) continue; pr.push({ geo: G.cone, m: M4(x, 0.18, z, 0.07, 0.4 + R() * 0.3, 0.07, R() * 3, (R() - 0.5) * 0.3, (R() - 0.5) * 0.3), color: R() < 0.5 ? '#7cc85a' : '#5fae44' }); }
      for (let i = 0; i < 30; i++) { const x = -24 + R() * 48, z = -4.6 + R() * 20; if (Math.abs(x) < 9 && z < 4) continue; pr.push({ geo: G.ico0 || G.ico, m: M4(x, 0.3, z, 0.08), color: ['#ffd84a', '#ffffff', '#8a7ad8'][i % 3] }); }
      // reeds and irises at the water's edge, willows to the sides, round stones
      for (let i = 0; i < 26; i++) { const x = -24 + i * 1.9 + R() * 0.6, z = -5.8 + R() * 0.4; if (Math.abs(x) < 3) continue; for (let j = 0; j < 4; j++) pr.push({ geo: G.cone, m: M4(x + (j - 1.5) * 0.12, 0.55, z, 0.04, 1.1 + R() * 0.5, 0.04, 0, (j - 1.5) * 0.08, 0), color: j % 2 ? '#6fa04a' : '#5f9440' }); if (i % 3 === 0) pr.push({ geo: G.ico, m: M4(x, 1.1, z, 0.09, 0.12, 0.09), color: '#6a5ac8' }); }
      for (const [x, z, h] of [[-15, -2.4, 4.4], [-18.4, 4.6, 4.0], [14.6, -2.2, 4.6], [18.0, 5.0, 4.2], [-10.4, 10.4, 3.8], [11.8, 11.2, 4.0]]) willow(pr, x, z, h, R);
      for (const [x, z, s] of [[-11.6, 2.4, 0.6], [10.4, 3.4, 0.5], [-6.8, 7.8, 0.45], [7.4, 8.4, 0.7]]) pr.push({ geo: G.ico, m: M4(x, 0.18, z, s, s * 0.6, s * 0.8, R() * 3), color: '#a8a39a' });
      scene.add(waterMesh(P, uni, -0.45, 140, 60, 0, -36, FN, FF));
      // last night's paper lanterns adrift on the water, two swans
      const LC = ['#f2c94c', '#e2574c', '#4c7fd8', '#5fae4f', '#f4efe2', '#c96fa8'];
      for (let i = 0; i < 14; i++) {
        const x = -22 + R() * 44, z = -9 - R() * 18, ry = R() * 3, tx = 0.15 * (R() - 0.5), tz = 0.15 * (R() - 0.5);
        pr.push({ geo: G.box, m: M4(x, -0.3, z, 0.5, 0.45, 0.5, ry, tx, tz), color: LC[i % LC.length] }, { geo: G.box, m: M4(x, -0.06, z, 0.58, 0.06, 0.58, ry, tx, tz), color: '#4a3a2e' }, { geo: G.box, m: M4(x, 0.02, z, 0.08, 0.14, 0.08, ry), color: '#4a3a2e' });
      }
      for (const [x, z] of [[-7, -14], [-5.6, -15.4]]) { pr.push({ geo: G.sphere, m: M4(x, -0.25, z, 0.4, 0.26, 0.62), color: '#f8f8f4' }, rod([x, -0.2, z + 0.4], [x, 0.5, z + 0.5], 0.06, '#f8f8f4'), { geo: G.ico, m: M4(x, 0.55, z + 0.56, 0.1, 0.09, 0.13), color: '#f8f8f4' }); }
      // Candil's island across the water: its stilt huts, and the Lantern House with the great lantern on top
      const IX = 10, IZ = -40;
      far.push({ geo: G.cyl, m: M4(IX, -0.3, IZ, 14, 0.8, 9), color: '#6a9a4a' });
      for (const [dx, dz, w] of [[-8, 2, 3.4], [-4, -3, 3], [6, 3, 3.2], [9, -2, 2.8]]) { far.push({ geo: G.box, m: M4(IX + dx, 2.0, IZ + dz, w, 2.2, w * 0.8), color: '#a8906a' }, { geo: G.cone4 || G.cone, m: M4(IX + dx, 3.8, IZ + dz, w * 0.8, 1.4, w * 0.7, Math.PI / 4), color: '#c9a24a' }); }
      far.push({ geo: G.cyl, m: M4(IX, 5.8, IZ, 2.4, 11.6, 2.4), color: '#c9b8a0' }, { geo: G.cyl, m: M4(IX, 12.4, IZ, 1.7, 1.6, 1.7), color: '#e8d6a0' }, { geo: G.cone, m: M4(IX, 13.9, IZ, 2.0, 1.4, 2.0), color: '#3a3036' });
      // the far shore: green hills, the Old Tower on its crag
      for (let x = -70; x < 70; x += 2) far.push({ geo: G.box, m: M4(x + 1, -0.3, -64, 2.05, 0.6, 4), color: P.grass[Math.floor(R() * 4)] });
      for (let i = 0; i < 12; i++) { const x = -60 + i * 11 + R() * 4, z = -70 - R() * 6, h = 6 + R() * 6; far.push({ geo: G.ico, m: M4(x, h * 0.4, z, 6 + R() * 3, h, 5), color: P.grass[i % 4] }); }
      far.push({ geo: G.cyl, m: M4(-26, 8, -78, 4, 18, 4), color: '#7a7484' }, { geo: G.cone, m: M4(-26, 18.6, -78, 4.6, 3.6, 4.6), color: '#5e5873' }, { geo: G.ico, m: M4(-26, 1, -78, 10, 6, 8), color: '#8a8580' });
    } else {
      // ---------------------------------------------------------- tomorrow: cracked stone underfoot, a forest of stone all round
      const c0 = new THREE.Color(P.stone[0]), c1 = new THREE.Color(P.stone[3]), cc = new THREE.Color();
      for (let x = -26; x < 26; x += 2.0) for (let z = -8.0; z < 18; z += 2.0) {
        const n = 0.5 + 0.5 * Math.sin(x * 0.37 + Math.cos(z * 0.29) * 2.1) * Math.cos(z * 0.31 + x * 0.07);
        floor.push({ geo: G.box, m: M4(x + 1.0, -0.12 - (n > 0.8 ? 0.02 : 0), z + 1.0, 1.96, 0.24, 1.96), color: '#' + cc.copy(c0).lerp(c1, n).getHexString() });
      }
      for (let i = 0; i < 40; i++) { const x = -24 + R() * 48, z = -7 + R() * 24; if (Math.abs(x) < 9 && z < 5) continue; pr.push({ geo: G.box, m: M4(x, 0.01, z, 1.4 + R(), 0.02, 0.06, R() * 3), color: '#5f5c56' }); }
      // stone reeds, stone trees, stumps, a fossil fish in the floor, boulders
      for (let i = 0; i < 24; i++) { const x = -24 + i * 2.0 + R() * 0.6, z = -7.4 + R() * 0.6; if (Math.abs(x) < 3) continue; for (let j = 0; j < 4; j++) pr.push({ geo: G.cone, m: M4(x + (j - 1.5) * 0.12, 0.55, z, 0.04, 1.1 + R() * 0.5, 0.04, 0, (j - 1.5) * 0.08, 0), color: j % 2 ? '#9a978f' : '#8a8780' }); }
      for (const [x, z, h] of [[-15, -3, 5.2], [-19, 5, 4.6], [15, -2.6, 5.4], [18.6, 5.4, 4.8], [-11, 11, 4.4], [12, 11.6, 4.6], [-23, -1, 4.0], [23, 1, 4.2]]) stoneTree(pr, x, z, h, R);
      for (const [x, z, h] of [[-8.4, 9.6, 0.8], [8.8, 8.8, 1.1]]) pr.push({ geo: G.cyl, m: M4(x, h / 2, z, 0.36, h, 0.36), color: '#8d8a84' });
      { const x = 6.4, z = 3.6; pr.push({ geo: G.sphere, m: M4(x, 0.02, z, 0.5, 0.05, 1.3), color: '#b8b4aa' }); for (let i = -3; i <= 3; i++) pr.push({ geo: G.box, m: M4(x, 0.05, z + i * 0.26, 0.7 - Math.abs(i) * 0.07, 0.03, 0.05), color: '#8a8680' }); }
      for (const [x, z, s] of [[-12, 3, 0.8], [11, 2.4, 0.6], [-7, 8, 0.5]]) pr.push({ geo: G.ico, m: M4(x, 0.25, z, s, s * 0.7, s * 0.8, R() * 3), color: P.rock[Math.floor(R() * 4)] });
      // the chapel's belfry behind the fight, stone, its bell gray in the arches; the stone forest far off
      const BX = -2, BZ = -26;
      far.push({ geo: G.box, m: M4(BX, 6, BZ, 4.2, 12, 4.2), color: '#857f75' }, { geo: G.box, m: M4(BX, 12.3, BZ, 4.8, 0.6, 4.8), color: '#9a958a' }, { geo: G.cone4 || G.cone, m: M4(BX, 14.2, BZ, 3.4, 3.4, 3.4, Math.PI / 4), color: '#5e5a66' });
      far.push({ geo: G.box, m: M4(BX, 10.4, BZ + 2.12, 2.0, 2.6, 0.06), color: '#2a2830' }, { geo: G.cyl, m: M4(BX, 10.2, BZ + 1.4, 0.8, 1.2, 0.8), color: '#8a8780' });
      for (const s of [-1, 1]) far.push({ geo: G.box, m: M4(BX + s * 7, 3.4, BZ + 2, 6, 6.8, 9), color: '#8f8a80' });
      for (let i = 0; i < 30; i++) { const x = -70 + i * 4.8 + R() * 2, z = -40 - R() * 18, h = 6 + R() * 6; far.push(rod([x, -0.5, z], [x + (R() - 0.5), h, z], 0.4, P.stone[i % 4])); for (let j = 0; j < 3; j++) { const a = R() * TAU; far.push(rod([x, h * 0.7, z], [x + Math.cos(a) * 2, h * 0.7 + 1.4, z + Math.sin(a) * 2], 0.14, P.rock[j % 4])); } }
      for (let x = -70; x < 70; x += 2) far.push({ geo: G.box, m: M4(x + 1, -0.4, -36, 2.05, 0.8, 4), color: P.rock[Math.floor(R() * 4)] });
    }

    const fl = new THREE.Mesh(merge(floor), stainMat(uni, kind)); fl.receiveShadow = true; fl.castShadow = true; scene.add(fl);
    const props = new THREE.Mesh(merge(pr), toon('#ffffff', { vc: 1, rim: 0.2 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    const farM = new THREE.Mesh(merge(far), toon('#ffffff', { vc: 1, rim: 0 })); scene.add(farM);
    // clouds drifting over (long ago); the dust that hangs in the air (tomorrow); the Hush's wisps by the foes
    const clouds = [];
    if (!stone) for (let i = 0; i < 3; i++) {
      const CR = rng(i + 371), pcs = [];
      for (let k = 0; k < 6; k++) pcs.push({ geo: G.ico, m: M4((k - 2.5) * 3.4 + CR() * 2, CR() * 1.5, CR() * 3, 2.6 + CR() * 2.2, 1.4 + CR(), 2.3 + CR()), color: k % 2 ? '#ffffff' : '#f4f9fd' });
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 }));
      m.position.set(-150 + CR() * 300, 34 + CR() * 12, -150 + CR() * 110); scene.add(m); clouds.push(m);
    }
    const motes = [];
    if (stone) for (let i = 0; i < 36; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#d8d4cc', transparent: true, opacity: 0.35, depthWrite: false })); s.scale.setScalar(0.12 + R() * 0.12); s.position.set(-16 + R() * 32, 0.5 + R() * 6, -8 + R() * 18); scene.add(s); motes.push({ s, ph: R() * TAU, y0: s.position.y }); }
    const wisps = [];
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.24); scene.add(s);
      const a = R() * TAU, d = 1.2 + R() * 3.2;
      wisps.push({ s, ph: R() * TAU, sp: 0.35 + R() * 0.4, ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 });
    }
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      clouds.forEach(cl => { cl.position.x += dt * 0.8; if (cl.position.x > 160) cl.position.x = -160; });
      for (const m of motes) m.s.position.y = m.y0 + Math.sin(t * 0.3 + m.ph) * 0.12;
      for (const w of wisps) {
        const k = ((t * w.sp * 0.25 + w.ph / TAU) % 1);
        w.s.position.set(stainC.x + w.ox + Math.sin(t + w.ph) * 0.3, k * 3.2, stainC.y + w.oz + Math.cos(t * 0.8 + w.ph) * 0.3);
        w.s.material.opacity = Math.sin(k * Math.PI) * 0.32 * uni.uStain.value;
      }
    }
    return { scene, sun, uni, update, P, harbor: true };
  }
  _.marshArenas = { build, PAL };
})();
