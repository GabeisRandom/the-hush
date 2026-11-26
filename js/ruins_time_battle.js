'use strict';
// The Sunken Ruins in battle, long ago and tomorrow: two arenas through stage.js's _.arenaBuilders (like port_battle.js's 'harbor').
//   'riverbank' (long ago): a grassy bank by the river that still ran through the canyon, the water rolling past behind the fight, reeds,
//     date palms, round stones, the red walls far off with green on their ledges, the temple's top in the distance. The Clay Parrot is
//     fought here (it flies down off the temple's roof), and so is any fight of then that names no place (TIME.land's arena).
//   'flooded' (tomorrow): a boardwalk deck over the sea that has filled the canyon, broken columns and a drowned palm sticking out of
//     the water, the temple's half-drowned top behind, the red walls stained at the tideline, a low gray sky. The Gray Moray and the
//     sunken temple's ambush are fought here, and so is any fight of tomorrow's canyon (TIME.land's arena).
// Everyone stands at y 0 (the bank's grass or the deck's planks) under the party's spots, the foes' row and the boss's spot, so a fight
// here needs no perches.
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || typeof TK === 'undefined') return;
  const _ = BATTLE._;
  const PAL = {
    riverbank: { fog: '#e8dcc0', skyTop: [0.36, 0.62, 0.88], skyHor: [0.93, 0.9, 0.82], hemiSky: '#fff4dc', hemiGround: '#6b7a4a', sun: '#fff0d0', hemiI: 0.7, sunI: 0.72,
      water: ['#3f9fc0', '#5fb8d0', '#e8f8fa'], grass: ['#5f9a46', '#6aa84a', '#58924a', '#74b052'], rock: ['#c8643c', '#d9834f', '#b4532f', '#e3a76c'], green: '#6f9a48' },
    flooded: { fog: '#b9c2c6', skyTop: [0.5, 0.56, 0.62], skyHor: [0.78, 0.8, 0.8], hemiSky: '#dfe6ea', hemiGround: '#5a6466', sun: '#f2f0ea', hemiI: 0.62, sunI: 0.5,
      water: ['#3f6f80', '#5a8a96', '#d8e4e6'], plank: ['#8a7058', '#7a6450', '#957a60', '#836a54'], rock: ['#a8664a', '#b8785a', '#9a5a42', '#c08a66'], green: '#5a6a5a' },
  };
  _.arenaBuilders = _.arenaBuilders || {};
  _.arenaBuilders.riverbank = K => build(K, 'riverbank');
  _.arenaBuilders.flooded = K => build(K, 'flooded');

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
    m.customProgramCacheKey = () => 'ruins-floor-' + key;
    return m;
  }
  function rod(a, b, r, color) {
    const G = TK.G, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    return { geo: G.cyl, m: new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(r, len, r)), color };
  }
  // moving water: a flat sheet with bands of light running along it (the river flows sideways; the sea rolls in)
  function waterMesh(P, uni, y, w, d, cx, cz, flow, FN, FF) {
    return new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: uni.uTime, uA: { value: new THREE.Color(P.water[0]) }, uB: { value: new THREE.Color(P.water[1]) }, uF: { value: new THREE.Color(P.water[2]) }, uFog: { value: new THREE.Color(P.fog) }, uFogNear: { value: FN }, uFogFar: { value: FF }, uFlow: { value: flow } },
      vertexShader: 'varying vec3 vW; varying float vFogD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uTime, uFogNear, uFogFar, uFlow; uniform vec3 uA, uB, uF, uFog; varying vec3 vW; varying float vFogD;
        void main(){
          vec2 p = vW.xz;
          float s1 = sin(p.x * 0.9 - uTime * 1.6 * uFlow + sin(p.y * 0.7) * 1.2), s2 = sin(p.y * 1.3 + uTime * (1.0 - uFlow) * 0.8 + sin(p.x * 0.4 + uTime * 0.3) * 1.6);
          vec3 col = mix(uA, uB, 0.5 + 0.25 * s1 + 0.15 * s2);
          col = mix(col, uF, smoothstep(0.88, 0.97, s1 * 0.6 + s2 * 0.4) * 0.45);
          col = mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD));
          gl_FragColor = vec4(col, 0.92);
        }`,
      transparent: true, depthWrite: false })).translateX(cx).translateZ(cz).translateY(y);
  }
  function palm(pr, x, z, y0, h, R) {
    const G = TK.G, M4 = TK.M4; let px = x, py = y0, lean = (R() - 0.5) * 0.5;
    for (let i = 0; i < 6; i++) { const nx = px + lean * 0.12; pr.push(rod([px, py, z], [nx, py + h / 6, z], 0.22 - i * 0.02, i % 2 ? '#9a7048' : '#8a6040')); px = nx; py += h / 6; }
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; pr.push({ geo: G.ico1, m: M4(px + Math.cos(a) * 1.2, py - 0.1 - (i % 2) * 0.2, z + Math.sin(a) * 1.2, 1.4, 0.12, 0.38, -a, 0, 0.42), color: i % 2 ? '#5fae4f' : '#4f9a45' }); }
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
    const R = rng(kind === 'flooded' ? 7311 : 7307);
    const floor = [], pr = [], far = [];
    const flooded = kind === 'flooded';

    // ---------------------------------------------------------- the ground everyone stands on (y 0): the bank's grass, or the deck
    if (!flooded) {
      const g0 = new THREE.Color(P.grass[0]), g1 = new THREE.Color(P.grass[3]), gc = new THREE.Color();
      for (let x = -26; x < 26; x += 2.0) for (let z = -6.0; z < 18; z += 2.0) {
        const n = 0.5 + 0.5 * Math.sin(x * 0.21 + Math.cos(z * 0.17) * 1.6) * Math.cos(z * 0.23 - 0.4);
        floor.push({ geo: G.box, m: M4(x + 1.0, -0.12, z + 1.0, 2.02, 0.24, 2.02), color: '#' + gc.copy(g0).lerp(g1, n).getHexString() });
      }
      // the bank's edge down to the water, behind the fight
      for (let x = -26; x < 26; x += 1.6) floor.push({ geo: G.box, m: M4(x + 0.8, -0.32, -6.4, 1.62, 0.5, 0.9, 0.05 * Math.sin(x)), color: '#8a6a4a' });
      // grass tufts and flowers (clear of the middle, where the fight stands)
      for (let i = 0; i < 140; i++) { const x = -24 + R() * 48, z = -5.4 + R() * 22; if (Math.abs(x) < 10 && z < 4.5) continue; pr.push({ geo: G.cone, m: M4(x, 0.18, z, 0.07, 0.4 + R() * 0.3, 0.07, R() * 3, (R() - 0.5) * 0.3, (R() - 0.5) * 0.3), color: R() < 0.5 ? '#7cc85a' : '#5fae44' }); }
      for (let i = 0; i < 30; i++) { const x = -24 + R() * 48, z = -4.6 + R() * 20; if (Math.abs(x) < 9 && z < 4) continue; pr.push({ geo: G.ico0 || G.ico, m: M4(x, 0.3, z, 0.08), color: ['#ffd84a', '#ff8fb1', '#ffffff'][i % 3] }); }
      // reeds on the bank, palms behind and to the sides, round stones
      for (let i = 0; i < 26; i++) { const x = -24 + i * 1.9 + R() * 0.6, z = -5.8 + R() * 0.4; if (Math.abs(x) < 3) continue; for (let j = 0; j < 4; j++) pr.push({ geo: G.cone, m: M4(x + (j - 1.5) * 0.12, 0.55, z, 0.04, 1.1 + R() * 0.5, 0.04, 0, (j - 1.5) * 0.08, 0), color: j % 2 ? '#6fa04a' : '#5f9440' }); pr.push({ geo: G.cyl, m: M4(x, 1.05, z, 0.05, 0.22, 0.05), color: '#7a5a3a' }); }
      for (const [x, z, h] of [[-14, -2.6, 6.2], [-17.5, 4.0, 5.4], [13.5, -2.0, 6.6], [17.4, 5.2, 5.8], [-9.6, 9.6, 5.0], [11.2, 10.6, 5.2]]) palm(pr, x, z, 0, h, R);
      for (const [x, z, s] of [[-11.6, 2.4, 0.7], [10.4, 3.4, 0.6], [-6.8, 7.8, 0.5], [7.4, 8.4, 0.8]]) pr.push({ geo: G.ico, m: M4(x, 0.2, z, s, s * 0.6, s * 0.8, R() * 3), color: '#b8b0a0' });
      // the river behind, flowing past
      scene.add(waterMesh(P, uni, -0.45, 120, 16, 0, -14.5, 1, FN, FF));
      // the far bank: grass, palms, the red walls with green on their ledges, the temple's top off to the left
      for (let x = -60; x < 60; x += 2) far.push({ geo: G.box, m: M4(x + 1, -0.3, -24, 2.05, 0.6, 3.6), color: P.grass[Math.floor(R() * 4)] });
      for (let i = 0; i < 9; i++) palm(far, -40 + i * 10 + R() * 4, -26 + R() * 2, -0.1, 5 + R() * 2, R);
    } else {
      // tomorrow: a wide deck of old planks at y 0 over the sea, its posts down into the water, a rope rail at the back
      for (let x = -12, i = 0; x < 9.5; x += 0.44, i++) floor.push({ geo: G.box, m: M4(x + 0.21, -0.06, -0.7, 0.41, 0.12, 7.6 + (i % 4 === 1 ? 0.1 : 0), 0, 0, 0.006 * ((i * 7) % 3 - 1)), color: P.plank[i % 4] });
      for (const z of [-4.42, 3.02]) floor.push({ geo: G.box, m: M4(-1.25, -0.2, z, 21.6, 0.16, 0.18), color: '#5a4636' });
      for (let x = -11.6; x < 9.5; x += 2.2) for (const z of [-4.3, 2.9]) pr.push({ geo: G.cyl, m: M4(x, -1.2, z, 0.14, 2.4, 0.14), color: '#4a3a2e' });
      for (let x = -11.2; x < 9.4; x += 2.45) pr.push({ geo: G.cyl, m: M4(x, 0.5, -4.3, 0.06, 1.0, 0.06), color: '#5a4636' });
      pr.push(rod([-11.2, 0.95, -4.3], [9.2, 0.95, -4.3], 0.025, '#c9b48e'));
      // the sea all round
      scene.add(waterMesh(P, uni, -0.55, 320, 320, 0, 0, 0, FN, FF));
      // broken columns and the drowned temple's top sticking out of the water, a dead palm, a buoy, a moored raft
      for (const [x, z, h, r] of [[-15, -8, 2.2, 0.55], [-9.4, -11.6, 1.2, 0.6], [12.6, -9.2, 2.8, 0.5], [16.4, -2.4, 1.0, 0.6], [-17.6, 3.2, 1.6, 0.5]]) {
        pr.push({ geo: G.cyl, m: M4(x, -0.6 + h / 2, z, r, h, r), color: '#d4a878' }, { geo: G.box, m: M4(x, -0.6 + h + 0.12, z, r * 2.3, 0.24, r * 2.3), color: '#c99a68' });
        for (let j = 0; j < 4; j++) pr.push({ geo: G.ico, m: M4(x + Math.cos(j * 1.6) * r, -0.45, z + Math.sin(j * 1.6) * r, 0.18, 0.06, 0.12), color: '#4f6a5a' });
      }
      const TX = 0, TZ = -22;
      pr.push({ geo: G.box, m: M4(TX, 1.2, TZ, 16, 3.6, 5), color: '#c99a68' }, { geo: G.box, m: M4(TX, 3.3, TZ, 16.6, 0.6, 5.4), color: '#d9a46a' });
      for (let i = 0; i < 6; i++) pr.push({ geo: G.cyl, m: M4(-6.5 + i * 2.6, 1.6, TZ + 2.8, 0.42, 3.4, 0.42), color: '#d4a878' });
      pr.push({ geo: G.box, m: M4(TX, 1.4, TZ + 2.75, 3.0, 2.8, 0.06), color: '#141017' });
      pr.push(rod([-13.4, -0.6, -5.8], [-13.0, 4.8, -6.0], 0.18, '#6a6058'));
      for (let i = 0; i < 5; i++) pr.push(rod([-13.0, 3.6 + i * 0.25, -6.0], [-13.0 + Math.cos(i * 1.4) * 1.2, 4.2 + i * 0.2, -6.0 + Math.sin(i * 1.4) * 1.2], 0.04, '#6a6058'));
      pr.push({ geo: G.sphere, m: M4(10.6, -0.4, 5.2, 0.4, 0.34, 0.4), color: '#e2574c' }, { geo: G.cyl, m: M4(10.6, 0.15, 5.2, 0.05, 0.7, 0.05), color: '#5a3a24' });
      for (let i = 0; i < 5; i++) pr.push({ geo: G.box, m: M4(-6 + i * 0.6, -0.42, 6.2, 0.55, 0.12, 2.0), color: P.plank[i % 4] });
      // the far canyon walls, wet and dark up to the tideline
      for (let x = -60; x < 60; x += 2) far.push({ geo: G.box, m: M4(x + 1, -0.5, -40, 2.05, 1.0, 4), color: '#4f6a5a' });
    }
    // the red canyon walls far off, in bands (green ledges long ago, a dark tideline tomorrow)
    for (let i = 0; i < 26; i++) {
      const x = -70 + i * 5.6 + R() * 2, z = flooded ? -46 - R() * 6 : -42 - R() * 6, h = 14 + R() * 10;
      for (let j = 0; j < 4; j++) far.push({ geo: G.box, m: M4(x, j * h / 4 + h / 8 - 1, z, 6.2 - j * 0.4, h / 4 + 0.1, 5), color: P.rock[(i + j) % 4] });
      far.push({ geo: G.box, m: M4(x, h - 1 + 0.2, z, 5.0, 0.4, 4.6), color: flooded ? '#7a7a6a' : P.green });
    }
    for (const [x0, s] of [[-1, 1], [1, -1]]) for (let i = 0; i < 6; i++) { const x = x0 * (28 + i * 5), z = -30 + i * 9, h = 12 + R() * 8; for (let j = 0; j < 3; j++) far.push({ geo: G.box, m: M4(x, j * h / 3 + h / 6 - 1, z, 5, h / 3 + 0.1, 8), color: P.rock[(i + j) % 4] }); void s; }
    if (!flooded) { const TX = -22, TZ = -32; far.push({ geo: G.box, m: M4(TX, 2.2, TZ, 12, 4.4, 4), color: '#e3b07a' }, { geo: G.box, m: M4(TX, 4.6, TZ, 12.6, 0.6, 4.4), color: '#c96f45' }); for (let i = 0; i < 5; i++) far.push({ geo: G.cyl, m: M4(TX - 4.8 + i * 2.4, 2.0, TZ + 2.2, 0.36, 4.0, 0.36), color: '#e8c49a' }); }

    const fl = new THREE.Mesh(merge(floor), stainMat(uni, kind)); fl.receiveShadow = true; fl.castShadow = true; scene.add(fl);
    const props = new THREE.Mesh(merge(pr), toon('#ffffff', { vc: 1, rim: 0.2 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    const farM = new THREE.Mesh(merge(far), toon('#ffffff', { vc: 1, rim: 0 })); scene.add(farM);
    // clouds drifting over, and the Hush's wisps by the foes
    const clouds = [];
    for (let i = 0; i < 3; i++) {
      const CR = rng(i + 271), pcs = [];
      for (let k = 0; k < 6; k++) pcs.push({ geo: G.ico, m: M4((k - 2.5) * 3.4 + CR() * 2, CR() * 1.5, CR() * 3, 2.6 + CR() * 2.2, 1.4 + CR(), 2.3 + CR()), color: flooded ? (k % 2 ? '#c8ccd0' : '#b8bcc0') : (k % 2 ? '#ffffff' : '#f4f9fd') });
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 }));
      m.position.set(-150 + CR() * 300, 34 + CR() * 12, -150 + CR() * 110); scene.add(m); clouds.push(m);
    }
    const wisps = [];
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.24); scene.add(s);
      const a = R() * TAU, d = 1.2 + R() * 3.2;
      wisps.push({ s, ph: R() * TAU, sp: 0.35 + R() * 0.4, ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 });
    }
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      clouds.forEach(cl => { cl.position.x += dt * 1.0; if (cl.position.x > 160) cl.position.x = -160; });
      for (const w of wisps) {
        const k = ((t * w.sp * 0.25 + w.ph / TAU) % 1);
        w.s.position.set(stainC.x + w.ox + Math.sin(t + w.ph) * 0.3, k * 3.2, stainC.y + w.oz + Math.cos(t * 0.8 + w.ph) * 0.3);
        w.s.material.opacity = Math.sin(k * Math.PI) * 0.32 * uni.uStain.value;
      }
    }
    return { scene, sun, uni, update, P, harbor: true };
  }
  _.ruinsArenas = { build, PAL };
})();
