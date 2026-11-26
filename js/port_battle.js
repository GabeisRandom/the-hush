'use strict';
// Port Brisa in battle: the harbor arena (place.biome 'harbor'), through stage.js's _.arenaBuilders (like ruins_battle.js's
// 'desert' and 'temple'). A wide wooden pier over the sea with the stone quay at its left end: sea water rolling in (no lily
// pads, no reeds), foam lapping at the pier, buoys bobbing, pier posts with a rope rail along the back, coils of rope,
// bollards, fenders, crates and barrels, a breakwater with its little lighthouse far off, gulls wheeling overhead.
// Everyone stands on the deck (its top is y = 0 under the party's spots, the foes' row, the boss's spot and the stones), so a
// fight here needs no perches (stage.js places those at the lake only).
// Who fights here: any place in Port Brisa (flow.js biomeOf: PORT.areaAt says the city, the bay or the sea fort; not the road),
// the sea fort's fights (port_fort.js FIGHT_AT), and the port's time bosses (port_time_boss.js). Mirror Lake keeps 'lake'.
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || typeof TK === 'undefined') return;
  const _ = BATTLE._;
  const PAL = { fog: '#cfe1e8', skyTop: [0.3, 0.56, 0.86], skyHor: [0.84, 0.92, 0.95], hemiSky: '#e6f2fa', hemiGround: '#6b7c76', sun: '#fff1da', hemiI: 0.66, sunI: 0.68,
    deep: '#2b6a8a', mid: '#3d8fa9', foam: '#f2fafa', far: '#a9cad8', plank: ['#a57d57', '#94704c', '#b08860', '#9c7652'], beam: '#6e5038', post: '#5f4532',
    stone: ['#bdb6a8', '#aca596', '#c6bfb1'], rope: '#d8c79b' };
  const WATER_Y = -0.55, DECK = { x0: -30, x1: 8.5, z0: -4.4, z1: 3.0 };
  _.arenaBuilders = _.arenaBuilders || {};
  _.arenaBuilders.harbor = K => buildHarbor(K);

  // the deck's material: vertex-colored toon, grayed by the Hush around the foes (as the other arenas' floors)
  function stainMat(uni) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    m.customProgramCacheKey = () => 'harbor-deck';
    return m;
  }
  // a thin rod from a to b ([x, y, z]): rope, rails, a buoy's cage
  function rod(a, b, r, color) {
    const G = TK.G, dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / len, dy / len, dz / len));
    return { geo: G.cyl, m: new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(r, len, r)), color };
  }

  function buildHarbor(K) {
    const P = PAL, FN = 22, FF = 96, { merge, M4, toon, glowTex } = TK, G = TK.G;
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
    const R = rng(4242);

    // ---------------------------------------------------------- the sea: swells rolling in, chop over them, foam lapping at the
    // pier and the quay, paler far out; gray where the Hush sits
    const cx = (DECK.x0 + DECK.x1) / 2, cz = (DECK.z0 + DECK.z1) / 2, hx = (DECK.x1 - DECK.x0) / 2, hz = (DECK.z1 - DECK.z0) / 2;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(320, 320).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: uni.uTime, uStain: uni.uStain, uStainC: uni.uStainC, uDeep: { value: new THREE.Color(P.deep) }, uMid: { value: new THREE.Color(P.mid) },
        uFoam: { value: new THREE.Color(P.foam) }, uFar: { value: new THREE.Color(P.far) }, uFog: { value: new THREE.Color(P.fog) }, uFogNear: { value: FN }, uFogFar: { value: FF },
        uDeck: { value: new THREE.Vector4(cx, cz, hx, hz) } },
      vertexShader: `varying vec3 vW; varying float vFogD;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uTime, uStain, uFogNear, uFogFar; uniform vec2 uStainC; uniform vec4 uDeck;
        uniform vec3 uDeep, uMid, uFoam, uFar, uFog; varying vec3 vW; varying float vFogD;
        void main(){
          vec2 p = vW.xz;
          float far = smoothstep(12.0, 70.0, length(p - vec2(0.0, -4.0)));
          vec3 col = mix(uMid, uDeep, smoothstep(-3.0, -24.0, p.y) * 0.75);
          col = mix(col, uFar, far * 0.6);
          float s1 = sin(p.y * 0.55 + uTime * 0.9 + sin(p.x * 0.18) * 1.4);
          float s2 = sin(p.x * 0.9 - uTime * 0.7 + sin(p.y * 0.6 + uTime * 0.3) * 1.8);
          float band = smoothstep(0.86, 0.95, s1 * 0.6 + s2 * 0.4);
          col = mix(col, uFoam, band * 0.38 * (1.0 - far));
          col *= 0.95 + 0.05 * step(0.0, s2);
          vec2 q = abs(p - uDeck.xy) - uDeck.zw;
          float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
          float lap = (1.0 - smoothstep(0.0, 1.2, d)) * (0.55 + 0.45 * sin(d * 9.0 - uTime * 2.6));
          col = mix(col, uFoam, clamp(lap, 0.0, 1.0) * 0.62 * step(0.0, d));
          float hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(p, uStainC)));
          vec3 gray = vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.93, 1.12) + vec3(0.06, 0.05, 0.09);
          col = mix(col, gray, hk * 0.75);
          gl_FragColor = vec4(mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD)), 1.0);
        }`,
    }));
    water.position.y = WATER_Y; scene.add(water);

    // ---------------------------------------------------------- the deck (planks over beams on posts) and the stone quay at
    // its left end, in one mesh
    const dk = [], DZ = DECK.z1 - DECK.z0;
    for (let x = -11, i = 0; x < DECK.x1 - 0.05; x += 0.44, i++) dk.push({ geo: G.box, m: M4(x + 0.21, -0.06, cz, 0.41, 0.12, DZ + (i % 4 === 1 ? 0.1 : 0), 0.006 * ((i * 7) % 3 - 1)), color: P.plank[i % 4] });
    for (const z of [DECK.z0 + 0.08, DECK.z1 - 0.08]) dk.push({ geo: G.box, m: M4((DECK.x1 - 11) / 2, -0.2, z, DECK.x1 + 11, 0.16, 0.18), color: P.beam });
    dk.push({ geo: G.box, m: M4(DECK.x1 - 0.06, -0.2, cz, 0.16, 0.16, DZ), color: P.beam });
    for (let x = -10.6; x < DECK.x1; x += 2.2) for (const z of [DECK.z0 + 0.1, DECK.z1 - 0.1]) dk.push({ geo: G.cyl, m: M4(Math.min(x, DECK.x1 - 0.14), -1.2, z, 0.14, 2.2, 0.14), color: P.post });
    for (const z of [-1.6, 0.9]) dk.push({ geo: G.cyl, m: M4(DECK.x1 - 0.14, -1.2, z, 0.14, 2.2, 0.14), color: P.post });
    // the quay: big slabs, its stone face down to the water
    for (let x = DECK.x0, i = 0; x < -11; x += 1.6, i++) for (let z = DECK.z0, j = 0; z < DECK.z1 - 0.05; z += 1.24, j++) {
      const w = Math.min(1.56, -11 - x - 0.04), d = Math.min(1.2, DECK.z1 - z - 0.04);
      if (w > 0.1 && d > 0.1) dk.push({ geo: G.box, m: M4(x + w / 2, -0.15, z + d / 2, w, 0.3, d), color: P.stone[(i + j) % 3] });
    }
    dk.push({ geo: G.box, m: M4((DECK.x0 - 11) / 2, -0.95, DECK.z1 - 0.3, -11 - DECK.x0, 1.3, 0.6), color: '#948d80' });
    dk.push({ geo: G.box, m: M4((DECK.x0 - 11) / 2, -0.95, DECK.z0 + 0.3, -11 - DECK.x0, 1.3, 0.6), color: '#948d80' });
    const deck = new THREE.Mesh(merge(dk), stainMat(uni)); deck.receiveShadow = true; deck.castShadow = true; scene.add(deck);

    // ---------------------------------------------------------- what stands on it: the rope rail along the back, bollards,
    // coils of rope, fenders on the front edge, crates and barrels in the back corners, a lamp and a net on the quay
    const pr = [];
    const railX = []; for (let x = -10.2; x < DECK.x1 - 0.2; x += 2.45) railX.push(x);
    const RZ = DECK.z0 + 0.12;
    for (const x of railX) { pr.push({ geo: G.cyl, m: M4(x, 0.5, RZ, 0.09, 1.0, 0.09), color: P.post }, { geo: G.sphere, m: M4(x, 1.02, RZ, 0.11, 0.07, 0.11), color: P.beam }); }
    for (let k = 1; k < railX.length; k++) {
      const a = railX[k - 1], b = railX[k], n = 6;
      for (const top of [0.92, 0.5]) for (let s = 0; s < n; s++) {
        const u0 = s / n, u1 = (s + 1) / n, y = u => top - 0.16 * (1 - (2 * u - 1) * (2 * u - 1));
        pr.push(rod([a + (b - a) * u0, y(u0), RZ], [a + (b - a) * u1, y(u1), RZ], 0.026, P.rope));
      }
    }
    // bollards: on the front edge, and along the quay
    for (const [x, z] of [[-9.0, 2.55], [6.6, 2.55], [-14.5, 2.45], [-21.0, 2.45], [-27.0, 2.45]]) {
      pr.push({ geo: G.cyl, m: M4(x, 0.2, z, 0.17, 0.4, 0.17), color: '#3d3a42' }, { geo: G.cyl, m: M4(x, 0.43, z, 0.22, 0.08, 0.22), color: '#4a4650' });
    }
    // coils of rope, three turns each
    for (const [x, z] of [[7.1, -3.4], [-9.4, -3.3], [-16.5, 1.6]]) for (let k = 0; k < 3; k++) pr.push({ geo: new THREE.TorusGeometry(0.34 - k * 0.04, 0.055, 6, 16), m: M4(x, 0.06 + k * 0.1, z, 1, 1, 1, 0, Math.PI / 2), color: k % 2 ? '#cbb98a' : P.rope });
    // fenders hanging off the front edge
    for (const x of [-7.2, -1.6, 3.8]) { pr.push({ geo: G.cyl, m: M4(x, -0.42, DECK.z1 + 0.1, 0.16, 0.42, 0.16), color: x > 0 ? '#f2f0ea' : '#3f7fc4' }, { geo: G.sphere, m: M4(x, -0.2, DECK.z1 + 0.1, 0.16), color: x > 0 ? '#f2f0ea' : '#3f7fc4' }, { geo: G.sphere, m: M4(x, -0.64, DECK.z1 + 0.1, 0.16), color: x > 0 ? '#f2f0ea' : '#3f7fc4' }); pr.push(rod([x, -0.06, DECK.z1 - 0.02], [x, -0.2, DECK.z1 + 0.1], 0.02, P.rope)); }
    // crates and barrels, back left and back right (behind the party's line and clear of the boss's spot)
    for (const [x, y, z, s, r] of [[-9.7, 0.4, -2.6, 0.8, 0.2], [-8.8, 0.36, -3.5, 0.72, -0.3], [-9.3, 1.12, -3.0, 0.66, 0.5], [-13.2, 0.42, -3.6, 0.84, 0.1], [-13.0, 1.2, -3.5, 0.7, -0.2]]) {
      pr.push({ geo: G.box, m: M4(x, y, z, s, s, s, r), color: '#b58a58' });
      for (const k of [-1, 1]) pr.push({ geo: G.box, m: M4(x, y + k * s * 0.32, z, s * 1.02, s * 0.08, s * 1.02, r), color: '#8a643e' });
    }
    for (const [x, z] of [[7.7, -2.3], [8.0, -1.4], [-11.9, -2.9]]) {
      pr.push({ geo: G.cyl, m: M4(x, 0.42, z, 0.36, 0.84, 0.36), color: '#9a6a40' });
      for (const y of [0.16, 0.68]) pr.push({ geo: G.cyl, m: M4(x, y, z, 0.375, 0.06, 0.375), color: '#4a4650' });
    }
    // a lamp post on the quay, and a net drying with its orange floats
    pr.push({ geo: G.cyl, m: M4(-12.4, 1.3, -3.9, 0.07, 2.6, 0.07), color: '#2f3a44' }, { geo: G.box, m: M4(-12.4, 2.75, -3.9, 0.34, 0.42, 0.34), color: '#2f3a44' }, { geo: G.box, m: M4(-12.4, 2.75, -3.9, 0.26, 0.32, 0.26), color: '#fff0c4' }, { geo: G.cone, m: M4(-12.4, 3.06, -3.9, 0.26, 0.2, 0.26), color: '#2f3a44' });
    pr.push({ geo: G.sphere, m: M4(-17.5, 0.08, -3.2, 1.5, 0.12, 1.0), color: '#4f6b58' });
    for (let k = 0; k < 6; k++) pr.push({ geo: G.sphere, m: M4(-18.7 + k * 0.48, 0.17, -3.3 + Math.sin(k * 1.7) * 0.6, 0.1), color: '#f08a3c' });
    const props = new THREE.Mesh(merge(pr), toon('#ffffff', { vc: 1, rim: 0.2 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd98a', transparent: true, opacity: 0.45, depthWrite: false })); lampGlow.position.set(-12.4, 2.75, -3.9); lampGlow.scale.setScalar(1.1); scene.add(lampGlow);

    // ---------------------------------------------------------- far off: the breakwater and its lighthouse, the headland with
    // the town's houses, hills into the haze, a sailboat
    const fp = [];
    for (let x = -80; x < 24; x += 3.2) fp.push({ geo: G.box, m: M4(x, -0.1, -36 + Math.sin(x * 0.3) * 0.4, 3.3, 1.6 + R() * 0.4, 2.4, (R() - 0.5) * 0.08), color: P.stone[(Math.round(x) & 3) % 3] });
    {
      const LX = 27, LZ = -36;
      fp.push({ geo: G.cyl, m: M4(LX, 0.4, LZ, 1.6, 1.4, 1.6), color: '#a9a294' });
      fp.push({ geo: new THREE.CylinderGeometry(0.75, 1.1, 7, 14), m: M4(LX, 4.6, LZ, 1, 1, 1), color: '#f4f0e6' });
      for (const y of [2.6, 5.4]) fp.push({ geo: new THREE.CylinderGeometry(1, 1, 1, 14), m: M4(LX, y, LZ, 0.96 - (y - 2) * 0.05, 0.9, 0.96 - (y - 2) * 0.05), color: '#d2453a' });
      fp.push({ geo: G.cyl, m: M4(LX, 8.6, LZ, 0.62, 1.0, 0.62), color: '#fff2c0' }, { geo: G.cyl, m: M4(LX, 8.05, LZ, 0.95, 0.12, 0.95), color: '#3a3a44' }, { geo: G.cone, m: M4(LX, 9.5, LZ, 0.78, 0.8, 0.78), color: '#d2453a' });
      const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff2b0', transparent: true, opacity: 0.7, depthWrite: false })); lg.position.set(LX, 8.6, LZ); lg.scale.setScalar(3.4); scene.add(lg);
    }
    const HOUSE = ['#e8d8b8', '#f2c9a0', '#cfe0e8', '#f4e6c8', '#e6b8a6', '#d9e6c8'];
    for (let i = 0; i < 14; i++) {
      const x = -74 + i * 3.6 + R() * 1.2, z = -52 - R() * 6, y = 1.2 + Math.max(0, 6 - Math.abs(x + 52) * 0.3), w = 2.4 + R() * 1.2, h = 2.2 + R() * 1.4;
      fp.push({ geo: G.box, m: M4(x, y + h / 2, z, w, h, 2.6), color: HOUSE[i % HOUSE.length] }, { geo: new THREE.ConeGeometry(1, 1, 4), m: M4(x, y + h + 0.6, z, w * 0.78, 1.2, 1.9, Math.PI / 4), color: i % 3 ? '#c4583f' : '#b04a3a' });
    }
    for (let i = 0; i < 26; i++) { const x = -120 + i * 9 + R() * 4, z = -70 - R() * 14, s = 6 + R() * 6; fp.push({ geo: G.ico, m: M4(x, -1 + s * 0.35, z, s * 1.4, s * 0.7, s), color: i % 3 ? '#7f9a86' : '#8aa48e' }); }
    fp.push({ geo: G.ico, m: M4(-60, 0, -50, 22, 4.5, 9), color: '#93a88f' });
    // a sailboat out by the breakwater
    fp.push({ geo: new THREE.SphereGeometry(1, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2), m: M4(-12, WATER_Y + 0.3, -26, 0.7, 0.4, 2.0), color: '#f4f0e6' }, { geo: G.cyl, m: M4(-12, 1.9, -26, 0.05, 3.4, 0.05), color: '#7a5a3e' }, { geo: G.cone, m: M4(-12, 2.2, -25.6, 0.06, 2.6, 0.9, 0, 0, 0), color: '#f6f2ea' });
    const farM = new THREE.Mesh(merge(fp), toon('#ffffff', { vc: 1, rim: 0 })); scene.add(farM);

    // ---------------------------------------------------------- buoys bobbing (a red ball, a green can with its light, a white
    // one, another red), with foam rings round them and round the front posts
    const buoys = [];
    const buoy = (x, z, kind) => {
      const pcs = [];
      if (kind === 'can') {
        pcs.push({ geo: G.cyl, m: M4(0, 0.06, 0, 0.46, 0.26, 0.46), color: '#ece6d6' }, { geo: G.cyl, m: M4(0, 0.55, 0, 0.3, 0.8, 0.3), color: '#3f9a5a' }, { geo: G.cone, m: M4(0, 1.08, 0, 0.3, 0.3, 0.3), color: '#3f9a5a' });
        for (const a of [0.4, 2.0, 3.6, 5.2]) pcs.push(rod([Math.cos(a) * 0.24, 1.2, Math.sin(a) * 0.24], [Math.cos(a) * 0.1, 1.58, Math.sin(a) * 0.1], 0.025, '#2f3a44'));
        pcs.push({ geo: G.sphere, m: M4(0, 1.6, 0, 0.1), color: '#fff3b0' });
      } else {
        const c = kind === 'white' ? '#f4f2ec' : '#d9483b', band = kind === 'white' ? '#d9483b' : '#f4f2ec';
        pcs.push({ geo: G.sphere, m: M4(0, 0.16, 0, 0.36), color: c }, { geo: new THREE.TorusGeometry(0.35, 0.06, 6, 18), m: M4(0, 0.16, 0, 1, 1, 1, 0, Math.PI / 2), color: band }, { geo: new THREE.TorusGeometry(0.08, 0.025, 5, 10), m: M4(0, 0.54, 0, 1), color: '#4a4650' });
      }
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.24 })); m.position.set(x, WATER_Y, z); m.castShadow = true; scene.add(m);
      let glow = null;
      if (kind === 'can') { glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b8ffcf', transparent: true, opacity: 0.6, depthWrite: false })); glow.scale.setScalar(0.9); scene.add(glow); }
      buoys.push({ m, x, z, ph: R() * TAU, glow });
    };
    buoy(-4.6, -7.4, 'ball'); buoy(1.6, -10.2, 'can'); buoy(9.8, -6.2, 'white'); buoy(12.6, 1.4, 'ball'); buoy(-15.5, -8.6, 'white');
    const rings = buoys.map(b => ({ x: b.x, z: b.z, r: 0.5, ph: b.ph }));
    for (let x = -10.6; x < DECK.x1; x += 4.4) rings.push({ x, z: DECK.z1 - 0.1, r: 0.22, ph: R() * TAU });
    const foam = new THREE.InstancedMesh(new THREE.TorusGeometry(1, 0.09, 4, 22).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: P.foam, transparent: true, opacity: 0.72, depthWrite: false }), rings.length);
    foam.frustumCulled = false; scene.add(foam);
    const fm = new THREE.Matrix4(), fq = new THREE.Quaternion(), fv = new THREE.Vector3(), fs = new THREE.Vector3();

    // ---------------------------------------------------------- gulls wheeling high behind the fight (a V that flaps)
    const gulls = [];
    for (let i = 0; i < 3; i++) {
      const gp = [{ geo: G.sphere, m: M4(0, 0, 0, 0.12, 0.1, 0.3), color: '#f4f2ec' }, { geo: G.box, m: M4(-0.36, 0.08, 0, 0.62, 0.03, 0.2, 0, 0, 0.3), color: '#e8e6e0' },
        { geo: G.box, m: M4(0.36, 0.08, 0, 0.62, 0.03, 0.2, 0, 0, -0.3), color: '#e8e6e0' }, { geo: G.box, m: M4(-0.62, 0.17, -0.02, 0.14, 0.03, 0.16, 0, 0, 0.3), color: '#4a4650' }, { geo: G.box, m: M4(0.62, 0.17, -0.02, 0.14, 0.03, 0.16, 0, 0, -0.3), color: '#4a4650' }];
      const m = new THREE.Mesh(merge(gp), toon('#ffffff', { vc: 1, rim: 0.3 })); scene.add(m);
      gulls.push({ m, cx: -2 + i * 5, cz: -12 - i * 3, r: 5 + i * 1.6, y: 6.5 + i * 1.1, sp: 0.22 + i * 0.05, ph: i * 2.1 });
    }
    // clouds drifting over
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      const CR = rng(i + 170), pcs = [];
      for (let k = 0; k < 6; k++) pcs.push({ geo: G.ico, m: M4((k - 2.5) * 3.4 + CR() * 2, CR() * 1.5, CR() * 3, 2.6 + CR() * 2.2, 1.4 + CR(), 2.3 + CR()), color: k % 2 ? '#ffffff' : '#f4f9fd' });
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 }));
      m.position.set(-150 + CR() * 300, 36 + CR() * 12, -150 + CR() * 110); scene.add(m); clouds.push(m);
    }
    // the Hush's wisps by the foes
    const wisps = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.24); scene.add(s);
      const a = R() * TAU, d = 1.2 + R() * 3.2;
      wisps.push({ s, ph: R() * TAU, sp: 0.35 + R() * 0.4, ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 });
    }

    function update(t, dt, stainC) {
      uni.uTime.value = t;
      for (const b of buoys) {
        b.m.position.y = WATER_Y + Math.sin(t * 1.3 + b.ph) * 0.07;
        b.m.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.09; b.m.rotation.x = Math.sin(t * 0.7 + b.ph * 1.7) * 0.07;
        if (b.glow) { b.glow.position.set(b.x, b.m.position.y + 1.6, b.z); b.glow.material.opacity = 0.35 + 0.35 * (Math.sin(t * 2.2 + b.ph) > 0.6 ? 1 : 0); }
      }
      rings.forEach((q, i) => {
        const k = (t * 0.45 + q.ph / TAU) % 1, s = q.r + 0.15 + k * 0.6;
        fv.set(q.x, WATER_Y + 0.02, q.z); fs.set(s, 1, s); fm.compose(fv, fq, fs); foam.setMatrixAt(i, fm);
      });
      foam.instanceMatrix.needsUpdate = true;
      foam.material.opacity = 0.6;
      for (const g of gulls) {
        const a = t * g.sp + g.ph;
        g.m.position.set(g.cx + Math.cos(a) * g.r, g.y + Math.sin(t * 0.8 + g.ph) * 0.4, g.cz + Math.sin(a) * g.r * 0.6);
        g.m.rotation.y = -a; g.m.rotation.z = Math.sin(a) * 0.25;
        g.m.scale.y = 0.55 + 0.45 * Math.abs(Math.sin(t * 5 + g.ph));
      }
      clouds.forEach(cl => { cl.position.x += dt * 1.0; if (cl.position.x > 160) cl.position.x = -160; });
      for (const w of wisps) {
        const k = ((t * w.sp * 0.25 + w.ph / TAU) % 1);
        w.s.position.set(stainC.x + w.ox + Math.sin(t + w.ph) * 0.3, k * 3.2, stainC.y + w.oz + Math.cos(t * 0.8 + w.ph) * 0.3);
        w.s.material.opacity = Math.sin(k * Math.PI) * 0.32 * uni.uStain.value;
      }
    }
    return { scene, sun, uni, update, P, harbor: true };
  }
  _.harbor = { buildHarbor, PAL, DECK, WATER_Y };
})();
