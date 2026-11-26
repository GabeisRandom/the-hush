'use strict';
// The battle stage in toon 3D: a round clearing (a meadow, or forest-tinted), or the Mirror Lake (a dock
// over open water, the foes on lily pads and rafts), with its own
// THREE.Scene and camera. It owns the cast's models (you, Mimo, the Coach, the Hush creatures), their idle
// life and squash/stretch posing, particles and impact effects, the Hush stain that drains color
// from the foes' side (and lifts when you win), and a three-quarter camera that glides to frame
// each action. flow.js moves the state objects; this file turns them into pictures every frame.
(() => {
  const B = window.BATTLE, _ = B._;
  const { part, G, toon, merge, M4, glowTex, sparkTex } = TK;
  const INK = '#2b2235';

  const PAL = {
    meadow: { fog: '#cde6ee', skyTop: [0.26, 0.57, 0.9], skyHor: [0.84, 0.93, 0.96], hemiSky: '#d7ecff', hemiGround: '#5d7040', sun: '#fff0d2', hemiI: 0.62, sunI: 0.72,
      grassA: '#5a9a42', grassB: '#6aab4c', clear: '#86b65a', dirt: '#bfa275', ring: '#4b8a3b', far: '#4f8e3f',
      bladeBase: [0.24, 0.5, 0.2], bladeTip: [0.66, 0.86, 0.38], round: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346'], pine: ['#3f8a4e', '#468f55', '#529c5d'] },
    forest: { fog: '#a8c8b6', skyTop: [0.2, 0.42, 0.56], skyHor: [0.72, 0.85, 0.79], hemiSky: '#d0e6dc', hemiGround: '#3a5732', sun: '#ffe8c0', hemiI: 0.56, sunI: 0.62,
      grassA: '#3e7b39', grassB: '#4a8940', clear: '#6a974a', dirt: '#8a7454', ring: '#2e6830', far: '#335d2f',
      bladeBase: [0.14, 0.35, 0.15], bladeTip: [0.46, 0.7, 0.3], round: ['#3d7e3a', '#468a40', '#37733a', '#4f9447', '#3a7a3c'], pine: ['#2d6a41', '#336e47', '#3c7a4f'] },
  };
  // the Mirror Lake: a misty morning over still water
  PAL.lake = { fog: '#d2e2e4', skyTop: [0.36, 0.6, 0.82], skyHor: [0.85, 0.92, 0.93], hemiSky: '#e2eff6', hemiGround: '#557a6c', sun: '#fff1d8', hemiI: 0.66, sunI: 0.64,
    grassA: '#5c9947', grassB: '#6aa853', sand: '#c4b087', bed: '#3a5c55', far: '#557f5c', deep: '#3d7f92', shallow: '#6db0ab', foam: '#eaf7f3', mirror: '#bcd5da',
    bladeBase: [0.24, 0.48, 0.2], bladeTip: [0.64, 0.84, 0.4], reedBase: [0.3, 0.42, 0.2], reedTip: [0.74, 0.76, 0.44], pad: ['#58a64a', '#4c9844', '#67b156'],
    farTree: ['#4d7a5b', '#557f63', '#47705a'] };
  // the Corn Society's hall under the corn maze: warm torchlight in an earthen cellar
  PAL.cellar = { fog: '#2b1d15', hemiSky: '#ffd9a6', hemiGround: '#4b3222', sun: '#ffdcae', hemiI: 0.6, sunI: 0.5,
    earth: '#7b5a3d', earthD: '#5f4430', straw: '#d9b65e', wallA: '#6b4b33', wallB: '#82603f', bladeBase: [0.5, 0.38, 0.16], bladeTip: [0.9, 0.78, 0.42] };
  // the Frost Peaks (place.biome 'snow'; peaks.js, icetower.js): a snowy clearing among snowy pines, snow falling
  PAL.snow = { fog: '#dfe9f2', skyTop: [0.42, 0.62, 0.86], skyHor: [0.88, 0.93, 0.97], hemiSky: '#eef6ff', hemiGround: '#8a96a8', sun: '#fff6e8', hemiI: 0.7, sunI: 0.66,
    grassA: '#eef3f8', grassB: '#e2eaf2', clear: '#f6f9fc', dirt: '#c9d3dd', ring: '#d5e0ea', far: '#dfe8f1',
    bladeBase: [0.78, 0.84, 0.9], bladeTip: [0.97, 0.98, 1.0], round: ['#e8eef4', '#f4f8fb', '#dfe7ee', '#eef3f8', '#e4ebf2'], pine: ['#2f5a46', '#355f4a', '#3b6a52'] };
  // the Gray Marsh (place.biome 'marsh'; marsh.js): a misty gray-green clearing among dead willows and dark pines, will-o'-wisps
  PAL.marsh = { fog: '#aab3a6', skyTop: [0.5, 0.56, 0.58], skyHor: [0.76, 0.8, 0.77], hemiSky: '#d4ddd6', hemiGround: '#3c4636', sun: '#f2ecd8', hemiI: 0.6, sunI: 0.5,
    grassA: '#5c6e48', grassB: '#687a50', clear: '#76835c', dirt: '#6b6450', ring: '#4f5e40', far: '#56634a',
    bladeBase: [0.26, 0.32, 0.2], bladeTip: [0.6, 0.66, 0.42], round: ['#5f6f55', '#6a785c', '#58664f', '#727f62', '#62705a'], pine: ['#3d5246', '#43584b', '#4a6052'] };
  const FOG_NEAR = 26, FOG_FAR = 95;
  // the lake's water line, and the dock where you and Mimo stand (its deck is at y = 0, from the bank out to DOCK_END)
  const WATER_Y = -0.07, DOCK_END = -0.55, DOCK_Z0 = -1.05, DOCK_Z1 = 1.95;
  const groundH = (x, z) => {
    const r = Math.hypot(x, z);
    return Math.pow(smoothstep(9, 42, r), 1.5) * 9 + (Math.sin(x * 0.21 + 1.3) * Math.cos(z * 0.17) * 0.5 + Math.sin(x * 0.07 - z * 0.09) * 0.8) * smoothstep(7, 18, r);
  };

  // ------------------------------------------------------------ arena (one per biome, built once)
  function makeSky(P) {
    const SUN = new THREE.Vector3(0.45, 0.6, -0.66).normalize();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { sunDir: { value: SUN }, top: { value: new THREE.Vector3(...P.skyTop) }, hor: { value: new THREE.Vector3(...P.skyHor) } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 sunDir; uniform vec3 top; uniform vec3 hor; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 col = mix(hor, top, pow(h, 0.55));
          float s = max(dot(vDir, sunDir), 0.0); col += vec3(1.0, 0.92, 0.7) * (pow(s, 12.0) * 0.3 + smoothstep(0.9975, 0.999, s) * 0.8);
          gl_FragColor = vec4(col, 1.0); }`,
    }));
    sky.renderOrder = -1;
    return sky;
  }
  function buildArena(biome) {
    if (_.arenaBuilders && _.arenaBuilders[biome]) return _.arenaBuilders[biome]({ PAL, makeSky, FOG_NEAR, FOG_FAR, groundH });     // (a region's own arena: ruins_battle.js's 'desert' and 'temple')
    if (biome === 'lake') return buildLake();
    if (biome === 'cellar') return buildCellar();
    if (biome === 'cave') return buildCave();
    const forest = biome === 'forest' || biome === 'marsh', snow = biome === 'snow', P = PAL[biome];     // (the marsh: a forest's clearing in its own colors)
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, FOG_NEAR, FOG_FAR);
    scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    // light
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(7, 16, 9); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    // sky
    scene.add(makeSky(P));
    // ground, with the Hush stain mixed in by a shader patch
    const geo = new THREE.PlaneGeometry(110, 110, 132, 132); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const C = k => new THREE.Color(P[k]);
    const GA = C('grassA'), GB = C('grassB'), CL = C('clear'), DI = C('dirt'), RI = C('ring'), FA = C('far');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      p.setY(i, groundH(x, z));
      c.copy(GA).lerp(GB, 0.5 + 0.5 * Math.sin(x * 0.35 + Math.cos(z * 0.3) * 2));
      c.lerp(CL, smoothstep(5.8, 3.6, r) * 0.7);
      const patch = Math.sin(x * 0.9 + 1.7) * Math.sin(z * 1.1 - 0.4) + Math.sin(x * 2.3 + z * 1.7) * 0.3;
      c.lerp(DI, smoothstep(5.2, 3.2, r) * smoothstep(0.35, 0.8, patch) * 0.55);
      c.lerp(RI, (1 - smoothstep(0, 0.5, Math.abs(r - 6.1))) * 0.45);
      c.lerp(FA, smoothstep(12, 34, r) * 0.35);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const gmat = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    gmat.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    gmat.customProgramCacheKey = () => 'battle-ground';
    const ground = new THREE.Mesh(geo, gmat); ground.receiveShadow = true; scene.add(ground);
    // grass blades: a ring around the clearing, plus short tufts inside it
    const R = rng(forest ? 21 : 11), blades = [];
    const homes = [[-3.5, 0.75], [-2.0, 0.2], [-5.5, 0.05], [1.75, 0.75], [3.75, -0.15], [2.4, 0.2], [2.6, -0.4], [4.9, 1.0], [-0.9, 1.9], [1.6, 1.0], [3.1, 0], [4.5, -0.9]];
    for (let i = 0; i < (forest ? 9000 : 12000); i++) {
      const r = 4.6 + 21 * Math.pow(R(), 1.7), a = R() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
      let h = (r < 6.4 ? 0.22 + R() * 0.2 : 0.32 + R() * 0.45) * (forest ? 0.85 : 1);
      // a short lawn between the camera and the stage, so the foreground never hides the fight
      const front = smoothstep(1.5, 4.5, z) * (1 - smoothstep(9, 13, Math.abs(x + 1)));
      if (front > 0.05 && R() < front * 0.55) continue;
      h *= 1 - front * 0.72;
      // and trodden grass where the cast stands
      const trod = homes.reduce((m, [hx, hz]) => Math.min(m, Math.hypot(hx - x, hz - z)), 9);
      h *= 0.3 + 0.7 * smoothstep(0.6, 2.2, trod);
      blades.push({ x, y: groundH(x, z) - 0.02, z, a: R(), h, w: 0.07 + R() * 0.05, c: R() });
    }
    for (let i = 0; i < 1600; i++) {
      const r = 1.2 + 3.4 * Math.sqrt(R()), a = R() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (homes.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 0.75)) continue;
      blades.push({ x, y: -0.02, z, a: R(), h: 0.08 + R() * 0.14, w: 0.06 + R() * 0.04, c: R() });
    }
    scene.add(grassMesh(blades, P, uni));
    // trees: behind and beside the clearing, never between the camera and the stage
    const swayers = [];
    const trees = [];
    for (let tries = 0; trees.length < (forest ? 52 : 17) && tries < 4000; tries++) {
      const a = R() * TAU, r = (forest ? 9.8 : 13) + R() * (forest ? 26 : 22);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > -1.5 && Math.abs(x) < 11.5) continue;
      if (trees.some(t => Math.hypot(t.x - x, t.z - z) < (forest ? 2.3 : 3.4))) continue;
      trees.push({ x, z, s: (forest ? 0.95 : 0.85) + R() * 0.6, kind: R() < (forest ? 0.62 : snow ? 0.8 : 0.3) ? 'pine' : R() < 0.25 ? 'big' : 'round', seed: R() });
    }
    trees.forEach(t => {
      const g = new THREE.Group(), y = groundH(t.x, t.z) - 0.1, TR = rng(Math.floor(t.seed * 1e6));
      g.position.set(t.x, y, t.z); g.scale.setScalar(t.s * (forest ? 1.25 : 1)); g.rotation.y = t.seed * TAU;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, t.kind === 'pine' ? 1.6 : 2.4, 7), toon(forest ? '#6e4c33' : '#8a5f3e', { rim: 0.15 }));
      trunk.position.y = t.kind === 'pine' ? 0.8 : 1.2; trunk.castShadow = true; g.add(trunk);
      let pieces;
      if (t.kind === 'pine') {
        pieces = [[1.0, 1.7, 1.55], [0.82, 2.55, 1.35], [0.6, 3.3, 1.1]].map(([rr, yy, hh], i) => ({ geo: new THREE.ConeGeometry(rr * 1.6, hh * 1.4, 9), m: M4(0, yy + 0.3, 0, 1), color: P.pine[i] }));
        if (snow) [[1.0, 1.7, 1.55], [0.82, 2.55, 1.35], [0.6, 3.3, 1.1]].forEach(([rr, yy, hh]) => pieces.push({ geo: new THREE.ConeGeometry(rr * 1.3, hh * 0.62, 9), m: M4(0, yy + 0.3 + hh * 0.42, 0, 1), color: '#f4f8fb' }));     // (snow on the boughs)
      } else {
        const big = t.kind === 'big' ? 1.45 : 1;
        pieces = [[0, 3.0, 0, 1.25], [0.9, 2.6, 0.3, 0.95], [-0.85, 2.7, -0.2, 1.0], [0.2, 3.7, -0.3, 0.9], [-0.3, 2.5, 0.85, 0.85], [0.4, 2.6, -0.85, 0.85]]
          .map(([x, yy, z, rr], i) => ({ geo: G.ico, m: M4(x * big, (yy - 0.3) * big + 0.3, z * big, rr * big * (0.92 + TR() * 0.18)), color: P.round[i % P.round.length] }));
      }
      const crown = new THREE.Mesh(merge(pieces), toon('#ffffff', { vc: 1, rim: 0.28 }));
      crown.castShadow = true;
      const pivot = new THREE.Group(); pivot.add(crown); g.add(pivot);
      swayers.push({ o: pivot, ph: t.seed * 10, amp: t.kind === 'pine' ? 0.012 : 0.022 });
      scene.add(g);
    });
    // far away: mountains (meadow) or a wall of dark pines (forest), and clouds
    const RM = rng(5);
    if (!forest) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + RM() * 0.2, d = 120 + RM() * 40, h = 38 + RM() * 40, r = 30 + RM() * 22;
        const pcs = [{ geo: new THREE.ConeGeometry(r, h, 7), m: M4(0, h / 2, 0, 1), color: snow ? (i % 2 ? '#9aa0aa' : '#a7adb6') : i % 2 ? '#7fa88f' : '#86ae9a' }];
        if (h > 60 || snow) pcs.push({ geo: new THREE.ConeGeometry(r * (snow ? 0.6 : 0.32), h * (snow ? 0.55 : 0.32), 7), m: M4(0, h * (snow ? 0.72 : 0.85), 0, 1.02), color: '#f4f8fb' });
        const mg = merge(pcs); mg.computeVertexNormals();
        const m = new THREE.Mesh(mg, toon('#ffffff', { vc: 1, rim: 0 })); m.position.set(Math.cos(a) * d, -6, Math.sin(a) * d); m.rotation.y = RM() * TAU; scene.add(m);
      }
    } else {
      const pcs = [];
      for (let i = 0; i < 90; i++) {
        const a = RM() * TAU, d = 36 + RM() * 16, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 1.2 + RM() * 1.2, y = groundH(x, z) - 0.4;
        pcs.push({ geo: new THREE.ConeGeometry(1.7 * s, 4.4 * s, 7), m: M4(x, y + 2.4 * s, z, 1), color: i % 2 ? '#2c5a3c' : '#315f42' });
        pcs.push({ geo: new THREE.ConeGeometry(1.25 * s, 3.2 * s, 7), m: M4(x, y + 4.4 * s, z, 1), color: '#376648' });
      }
      const fg = merge(pcs); fg.computeVertexNormals();
      scene.add(new THREE.Mesh(fg, toon('#ffffff', { vc: 1, rim: 0 })));
    }
    const clouds = [];
    if (!forest) for (let i = 0; i < 9; i++) {
      const CR = rng(i + 40), pcs = [];
      for (let k = 0; k < 6; k++) pcs.push({ geo: G.ico, m: M4((k - 2.5) * 3.4 + CR() * 2, CR() * 1.5, CR() * 3, 2.6 + CR() * 2.2, 1.4 + CR(), 2.3 + CR()), color: k % 2 ? '#ffffff' : '#f4f9fd' });
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 }));
      m.position.set(-150 + CR() * 300, 34 + CR() * 14, -150 + CR() * 120); scene.add(m); clouds.push(m);
    }
    // rocks, bushes, flowers, and a fairy ring of tiny mushrooms around the clearing
    for (let i = 0; i < 12; i++) {
      const a = R() * TAU, r = 7 + R() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 3 && Math.abs(x) < 7) continue;
      const s = 0.3 + R() * 0.7;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), toon(forest ? '#8f9488' : '#a3a196', { rim: 0.2 }));
      m.position.set(x, groundH(x, z) + s * 0.2, z); m.scale.set(s * 1.15, s * 0.75, s); m.rotation.set(R(), R() * 7, R() * 3);
      m.castShadow = m.receiveShadow = true; scene.add(m);
    }
    for (let i = 0; i < (forest ? 16 : 9); i++) {
      const a = R() * TAU, r = 8 + R() * 12, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > 0 && Math.abs(x) < 9) continue;
      const BR = rng(i + 7), s = 0.9 + BR() * 0.8;
      const pcs = [[0, 0.45, 0, 0.62], [0.5, 0.35, 0.2, 0.48], [-0.5, 0.38, -0.1, 0.5], [0.1, 0.35, -0.45, 0.45]].map(([bx, by, bz, br], k) => ({ geo: G.ico, m: M4(bx, by, bz, br * (0.9 + BR() * 0.2)), color: k % 2 ? P.round[2] : P.round[0] }));
      if (!forest && BR() < 0.6) for (let k = 0; k < 5; k++) { const aa = BR() * TAU; pcs.push({ geo: G.ico1, m: M4(Math.cos(aa) * 0.55, 0.5 + BR() * 0.3, Math.sin(aa) * 0.55, 0.07), color: '#fff3a8' }); }
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.25 })); m.position.set(x, groundH(x, z) - 0.05, z); m.scale.setScalar(s); m.castShadow = true; scene.add(m);
    }
    if (!snow) {
      const n = forest ? 160 : 320;
      const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 4), toon('#3f8a3a', { rim: 0 }), n);
      const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), toon('#ffffff', { rim: 0.2 }), n);
      const m = new THREE.Matrix4(), cc = new THREE.Color();
      const FC = forest ? ['#f4f0d8', '#c8b6f0', '#ffd27a'] : ['#ffffff', '#ffd447', '#ff8fb1', '#a8d0ff', '#ffb35c'];
      for (let i = 0; i < n; i++) {
        let r = 5.2 + Math.pow(R(), 1.3) * 16, a = R() * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (z > 1.5 && Math.abs(x + 1) < 11) { a = -Math.PI * (0.1 + R() * 0.8); x = Math.cos(a) * r; z = Math.sin(a) * r; }   // keep the camera's foreground clear
        const y = groundH(x, z), s = 0.8 + R() * 0.6;
        m.compose(new THREE.Vector3(x, y + 0.15 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s, s)); stems.setMatrixAt(i, m);
        m.compose(new THREE.Vector3(x, y + 0.32 * s, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(R(), R() * 5, 0)), new THREE.Vector3(s, s * 0.6, s)); heads.setMatrixAt(i, m);
        heads.setColorAt(i, cc.set(FC[i % FC.length]));
      }
      scene.add(stems, heads);
    }
    const shrooms = [];
    if (!snow) {
      const pcs = [];
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * TAU + R() * 0.15, r = 6.05 + (R() - 0.5) * 0.3, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.55 + R() * 0.5;
        pcs.push({ geo: new THREE.CylinderGeometry(0.035, 0.045, 0.16, 6), m: M4(x, 0.08 * s, z, s), color: '#f4ecdc' });
        pcs.push({ geo: new THREE.SphereGeometry(0.09, 10, 6, 0, TAU, 0, Math.PI / 2), m: M4(x, 0.15 * s, z, s, s * 0.8, s), color: forest ? '#9fd8c8' : (i % 3 ? '#e2574c' : '#f2c94c') });
      }
      const mg = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.3, emissive: forest ? '#1d4a43' : '#000000' }));
      scene.add(mg); shrooms.push(mg);
    }
    // drifting motes: fireflies or pollen, plus the Hush's wisps near the foes
    const motes = [];
    const moteN = snow ? 90 : forest ? 34 : 22;
    for (let i = 0; i < moteN; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: snow ? '#ffffff' : forest ? '#d8ff9a' : '#fff4d2', transparent: true, opacity: 0, depthWrite: false, blending: snow ? THREE.NormalBlending : THREE.AdditiveBlending }));
      s.scale.setScalar(forest ? 0.28 : snow ? 0.14 : 0.18); scene.add(s);
      motes.push({ s, x: (R() - 0.5) * (snow ? 34 : 22), z: (snow ? -14 : -9) + R() * (snow ? 22 : 14), y: 0.4 + R() * (snow ? 7 : 3), ph: R() * TAU, sp: 0.3 + R() * 0.5, kind: snow ? 'flake' : 'fly' });
    }
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.24); scene.add(s);
      const a = R() * TAU, d = 1.2 + R() * 3.2;
      motes.push({ s, x: 0, z: 0, y: R() * 3, ph: R() * TAU, sp: 0.35 + R() * 0.4, kind: 'hush', ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 });
    }
    // sun shafts in the forest
    const shafts = [];
    if (forest) {
      const tex = TK.canvasTex(32, 128, cx => { const g = cx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,248,220,0)'); g.addColorStop(0.3, 'rgba(255,248,220,0.55)'); g.addColorStop(1, 'rgba(255,248,220,0)'); cx.fillStyle = g; cx.fillRect(0, 0, 32, 128); });
      [[-6, -6, 0.5], [1.5, -8, -0.2], [7, -5, 0.35], [-2, -11, 0.1]].forEach(([x, z, r], i) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
        m.position.set(x, 6, z); m.rotation.z = 0.35 + r * 0.2; m.rotation.y = r; scene.add(m); shafts.push({ m, ph: i * 1.7 });
      });
    }
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      swayers.forEach(s => { s.o.rotation.z = Math.sin(t * 1.3 + s.ph) * s.amp; s.o.rotation.x = Math.sin(t * 0.9 + s.ph * 1.7) * s.amp * 0.6; });
      clouds.forEach(cl => { cl.position.x += dt * 1.2; if (cl.position.x > 160) cl.position.x = -160; });
      for (const m of motes) {
        if (m.kind === 'flake') {          // (snow: falling slowly, drifting, round and round)
          const y = 7.4 - ((t * m.sp * 0.9 + m.ph) % 7.4), x = m.x + Math.sin(t * m.sp + m.ph) * 0.6;
          m.s.position.set(x, y, m.z); m.s.material.opacity = 0.85 * Math.min(1, y * 2);
        } else if (m.kind === 'fly') {
          const x = m.x + Math.sin(t * m.sp + m.ph) * 1.2, z = m.z + Math.cos(t * m.sp * 0.8 + m.ph) * 0.9, y = m.y + Math.sin(t * m.sp * 1.6 + m.ph) * 0.35;
          m.s.position.set(x, y, z);
          m.s.material.opacity = forest ? 0.4 + 0.5 * Math.max(0, Math.sin(t * 2 + m.ph * 3)) : 0.55;
        } else {
          const k = ((t * m.sp * 0.25 + m.ph / TAU) % 1);
          m.s.position.set(stainC.x + m.ox + Math.sin(t + m.ph) * 0.3, k * 3.2, stainC.y + m.oz + Math.cos(t * 0.8 + m.ph) * 0.3);
          m.s.material.opacity = Math.sin(k * Math.PI) * 0.32 * uni.uStain.value;
        }
      }
      shafts.forEach(s => { s.m.material.opacity = 0.22 + Math.sin(t * 0.4 + s.ph) * 0.08; });
    }
    return { scene, sun, uni, update, P };
  }

  function grassMesh(blades, P, uni, fogNear = FOG_NEAR, fogFar = FOG_FAR) {
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.33, 0.5, 0, 0.33, 0.5, 0, 0, 1, 0]), 3));
    geo.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
    const n = blades.length, pos = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
    blades.forEach((b, i) => { pos[i * 3] = b.x; pos[i * 3 + 1] = b.y; pos[i * 3 + 2] = b.z; rnd[i * 4] = b.a; rnd[i * 4 + 1] = b.h; rnd[i * 4 + 2] = b.w; rnd[i * 4 + 3] = b.c; });
    geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3));
    geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { uTime: uni.uTime, uStain: uni.uStain, uStainC: uni.uStainC, uFog: { value: new THREE.Color(P.fog) }, uFogNear: { value: fogNear }, uFogFar: { value: fogFar },
        uBase: { value: new THREE.Vector3(...P.bladeBase) }, uTip: { value: new THREE.Vector3(...P.bladeTip) } },
      vertexShader: `uniform float uTime; uniform float uStain; uniform vec2 uStainC; uniform vec3 uBase; uniform vec3 uTip;
        attribute vec3 aPos; attribute vec4 aRnd;
        varying float vY; varying float vFogD; varying vec3 vCol;
        void main() {
          float bh = aRnd.y, bw = aRnd.z, ang = aRnd.x * 6.2831;
          vec3 p = vec3(cos(ang) * position.x * bw, position.y * bh, sin(ang) * position.x * bw);
          float bend = position.y * position.y;
          float wv = sin(uTime * 1.7 + aPos.x * 0.33 + aPos.z * 0.21) * 0.55 + sin(uTime * 3.3 + aPos.x * 1.1 + aPos.z * 0.7) * 0.15 + 0.45;
          p.xz += vec2(0.85, 0.4) * wv * 0.4 * bend * bh;
          vec4 mv = modelViewMatrix * vec4(aPos + p, 1.0);
          gl_Position = projectionMatrix * mv;
          vY = position.y; vFogD = -mv.z;
          vec3 col = mix(uBase, uTip, position.y) * (0.84 + 0.3 * aRnd.w);
          float hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(aPos.xz, uStainC)));
          vCol = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.98, 0.93, 1.18) + vec3(0.09, 0.08, 0.13), hk * 0.75);
        }`,
      fragmentShader: `uniform vec3 uFog; uniform float uFogNear, uFogFar; varying float vY; varying float vFogD; varying vec3 vCol;
        void main() { vec3 col = vCol * (0.78 + 0.22 * vY); gl_FragColor = vec4(mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD)), 1.0); }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
    return mesh;
  }

  // ------------------------------------------------------------ the Mirror Lake (place.biome 'lake', or anywhere west of x −120)
  // You and Mimo stand on a wooden dock that runs out from the near bank (on the left); the foes stand out on
  // the open water, frogs on lily pads and the rest on little rafts (setup adds those per fight). Reeds line
  // the banks, lily pads float about, and the far shore fades into the morning mist.
  const lakeH = (x, z) => {
    const bank = smoothstep(-6.6, -10.2, x + Math.sin(z * 0.37) * 0.7 + Math.sin(z * 0.11 + 1) * 0.9);   // the near bank, behind the dock
    const r = Math.hypot((x - 2) * 0.85, z + 7), a = Math.atan2(z + 7, x - 2);
    const far = smoothstep(29, 40, r + Math.sin(a * 5) * 2.5 + Math.sin(a * 13 + 1) * 1.1);                   // the far shores, all around
    const hills = Math.pow(smoothstep(42, 80, r), 1.3) * 11;
    return -1.25 + bank * 1.6 + far * 1.75 + hills + Math.sin(x * 0.4) * Math.cos(z * 0.33) * 0.14 * Math.min(1, bank + far);
  };
  const padShape = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 22, 1, false, 0.26, TAU - 0.52); g.translate(0, -0.5, 0); return g; })();
  const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
  function buildLake() {
    const P = PAL.lake, FN = 20, FF = 88;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, FN, FF);
    scene.background = new THREE.Color(P.fog);
    const rings = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0));
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) }, uRings: { value: rings } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(7, 16, 9); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    scene.add(makeSky(P));
    const R = rng(31);
    let boat = null;
    // the ground: the lake bed, a sandy water line, grassy banks, hills far off (with the Hush stain, like the meadow)
    const geo = new THREE.PlaneGeometry(170, 170, 150, 150); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const GA = new THREE.Color(P.grassA), GB = new THREE.Color(P.grassB), SA = new THREE.Color(P.sand), BE = new THREE.Color(P.bed), FA = new THREE.Color(P.far);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = lakeH(x, z);
      p.setY(i, h);
      c.copy(GA).lerp(GB, 0.5 + 0.5 * Math.sin(x * 0.35 + Math.cos(z * 0.3) * 2));
      c.lerp(FA, smoothstep(30, 55, Math.hypot(x, z)) * 0.6);
      c.lerp(SA, 1 - smoothstep(0.05, 0.4, Math.abs(h - WATER_Y - 0.05)));
      c.lerp(BE, smoothstep(-0.15, -0.6, h));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const gmat = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    gmat.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    gmat.customProgramCacheKey = () => 'battle-ground';
    const ground = new THREE.Mesh(geo, gmat); ground.receiveShadow = true; scene.add(ground);
    // the water: flat toon bands that drift, rings around whatever floats on it (uRings: x, z, radius, on), paler
    // far out where it mirrors the misty sky, and gray where the Hush sits
    const water = new THREE.Mesh(new THREE.PlaneGeometry(320, 320).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: uni.uTime, uStain: uni.uStain, uStainC: uni.uStainC, uRings: uni.uRings, uDeep: { value: new THREE.Color(P.deep) }, uShallow: { value: new THREE.Color(P.shallow) },
        uFoam: { value: new THREE.Color(P.foam) }, uMirror: { value: new THREE.Color(P.mirror) }, uFog: { value: new THREE.Color(P.fog) }, uFogNear: { value: FN }, uFogFar: { value: FF } },
      vertexShader: `varying vec3 vW; varying float vFogD;
        void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vFogD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uTime, uStain, uFogNear, uFogFar; uniform vec2 uStainC; uniform vec4 uRings[4];
        uniform vec3 uDeep, uShallow, uFoam, uMirror, uFog; varying vec3 vW; varying float vFogD;
        void main(){
          vec2 p = vW.xz;
          float shore = smoothstep(-5.5, -9.5, p.x) + smoothstep(24.0, 34.0, length(vec2((p.x - 2.0) * 0.85, p.y + 7.0)));
          vec3 col = mix(uDeep, uShallow, clamp(0.28 + shore * 0.6, 0.0, 1.0));
          float far = smoothstep(9.0, 40.0, length(p - vec2(2.0, -3.0)));
          col = mix(col, uMirror, far * 0.6);
          // drifting toon bands
          float w1 = sin(p.x * 0.85 + sin(p.y * 0.55 + uTime * 0.45) * 1.7 + uTime * 0.6);
          float w2 = sin(p.y * 1.25 - uTime * 0.8 + sin(p.x * 0.42) * 2.1);
          float band = smoothstep(0.84, 0.93, w1 * 0.55 + w2 * 0.45);
          col = mix(col, uFoam, band * 0.3 * (1.0 - far));
          col *= 0.94 + 0.06 * step(0.0, w2);
          // rings of ripples around the pads and rafts
          for (int i = 0; i < 4; i++) {
            vec4 R = uRings[i];
            if (R.w < 0.5) continue;
            float d = distance(p, R.xy) - R.z;
            if (d > 0.0 && d < 0.95) col = mix(col, uFoam, pow(1.0 - d / 0.95, 1.5) * 0.4 * smoothstep(0.78, 0.95, sin(d * 11.0 - uTime * 2.2) * 0.5 + 0.5));
          }
          float hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(p, uStainC)));
          vec3 gray = vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.93, 1.12) + vec3(0.06, 0.05, 0.09);
          col = mix(col, gray, hk * 0.75);
          gl_FragColor = vec4(mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD)), 1.0);
        }`,
    }));
    water.position.y = WATER_Y; water.renderOrder = 0; scene.add(water);
    // the dock: planks across two long beams on posts, out from the bank, with two mooring posts at its end
    {
      const pcs = [], wood = ['#9a7450', '#a57d57', '#8e6a48', '#a27a52'];
      for (let x = -10.4, i = 0; x < DOCK_END - 0.15; x += 0.43, i++) pcs.push({ geo: G.box, m: M4(x + 0.2, -0.05, (DOCK_Z0 + DOCK_Z1) / 2, 0.39, 0.1, DOCK_Z1 - DOCK_Z0 + (i % 3 === 1 ? 0.12 : 0), 0.015 * ((i * 7) % 3 - 1)), color: wood[i % wood.length] });
      for (const z of [DOCK_Z0 + 0.12, DOCK_Z1 - 0.12]) pcs.push({ geo: G.box, m: M4((DOCK_END - 10.4) / 2, -0.15, z, DOCK_END + 10.4, 0.12, 0.16), color: '#7a5a3e' });
      for (let x = -9.2; x < DOCK_END + 0.1; x += 2.9) for (const z of [DOCK_Z0 + 0.06, DOCK_Z1 - 0.06]) pcs.push({ geo: G.cyl, m: M4(Math.min(x, DOCK_END - 0.12), -0.65, z, 0.12, 1.25, 0.12), color: '#6e5038' });
      for (const z of [DOCK_Z0 + 0.06, DOCK_Z1 - 0.06]) {
        pcs.push({ geo: G.cyl, m: M4(DOCK_END - 0.12, 0.14, z, 0.13, 0.42, 0.13), color: '#7c5a3e' });
        pcs.push({ geo: new THREE.TorusGeometry(0.16, 0.035, 6, 14), m: M4(DOCK_END - 0.12, 0.22, z, 1, 1, 1, 0, Math.PI / 2), color: '#d8c79b' });
      }
      const dock = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.18 }));
      dock.castShadow = dock.receiveShadow = true; scene.add(dock);
      // a little rowboat tied up by the bank
      const bp = [];
      const hull = new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2);
      bp.push({ geo: hull, m: M4(0, 0.2, 0, 0.55, 0.32, 1.35), color: '#b4573e' });
      bp.push({ geo: new THREE.TorusGeometry(1, 0.06, 6, 24), m: M4(0, 0.2, 0, 0.55, 1.35, 1, 0, Math.PI / 2), color: '#f1e3c6' });
      bp.push({ geo: G.box, m: M4(0, 0.12, 0.1, 0.95, 0.05, 0.22), color: '#9a7450' });
      bp.push({ geo: G.box, m: M4(0, 0.12, -0.55, 0.8, 0.05, 0.2), color: '#9a7450' });
      boat = new THREE.Mesh(merge(bp), toon('#ffffff', { vc: 1, rim: 0.22, side: THREE.DoubleSide }));   // (you look down into the hull)
      boat.position.set(-7.4, WATER_Y - 0.06, DOCK_Z0 - 0.95); boat.rotation.y = 1.35; boat.castShadow = true; scene.add(boat);
    }
    // grass on the banks
    const blades = [];
    for (let i = 0; i < 9000 && blades.length < 5200; i++) {
      const x = -60 + R() * 120, z = -70 + R() * 95, h0 = lakeH(x, z);
      if (h0 < 0.1 || (z > 2.5 && x > -12)) continue;
      blades.push({ x, y: h0 - 0.02, z, a: R(), h: 0.25 + R() * 0.4, w: 0.07 + R() * 0.05, c: R() });
    }
    scene.add(grassMesh(blades, Object.assign({}, P, { bladeBase: P.bladeBase, bladeTip: P.bladeTip }), uni, FN, FF));
    // reeds in clumps along the water's edges (never between the camera and the fight), some with cattails
    const reeds = [], tails = [];
    const clumps = [];
    for (let z = -13; z < 7; z += 1.7 + R() * 1.4) if (z < DOCK_Z0 - 0.6 || z > DOCK_Z1 + 0.6) clumps.push([-8.6 - R() * 0.9, z, 1.1 + R() * 0.6]);
    for (let i = 0; i < 7; i++) clumps.push([7.4 + R() * 5, -6.5 + R() * 8, 0.9 + R() * 0.7]);
    for (let i = 0; i < 9; i++) clumps.push([-3 + R() * 14, -6.5 - R() * 5, 0.9 + R() * 0.8]);
    for (let i = 0; i < 26; i++) { const a = -Math.PI * (0.06 + R() * 0.88), d = 31 + R() * 4; clumps.push([2 + Math.cos(a) * d / 0.85, -7 + Math.sin(a) * d, 1.4 + R()]); }
    for (const [cx, cz, cr] of clumps) {
      const n = Math.round(30 + cr * 30);
      for (let k = 0; k < n; k++) {
        const a = R() * TAU, d = Math.sqrt(R()) * cr, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d * 0.7;
        if (z > 2.4 && Math.abs(x - 0.5) < 9) continue;
        const h = (0.75 + R() * 0.95) * (1 - (d / cr) * 0.35);
        reeds.push({ x, y: Math.max(WATER_Y, lakeH(x, z)) - 0.03, z, a: R(), h, w: 0.05 + R() * 0.035, c: R() });
        if (R() < 0.16) tails.push([x, Math.max(WATER_Y, lakeH(x, z)) + h * 0.86, z]);
      }
    }
    scene.add(grassMesh(reeds, Object.assign({}, P, { bladeBase: P.reedBase, bladeTip: P.reedTip }), uni, FN, FF));
    {
      const tm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 7), toon('#6b4a2e', { rim: 0.15 }), tails.length);
      const m = new THREE.Matrix4();
      tails.forEach(([x, y, z], i) => { m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.3, 0, (R() - 0.5) * 0.3)), new THREE.Vector3(1, 1, 1)); tm.setMatrixAt(i, m); });
      scene.add(tm);
    }
    // lily pads drifting about, a few with a flower (none on the dock, by the fight's own pads, or on land)
    const SPOTS = [[1.6, 1.0], [3.1, 0.0], [4.5, -0.9], [1.75, 0.75], [3.75, -0.15], [2.4, 0.2], [2.6, -0.4], [4.9, 1.0]];
    const pads = [];
    for (let i = 0; i < 400 && pads.length < 64; i++) {
      const x = -4 + R() * 32, z = -16 + R() * 26, r = 0.2 + R() * 0.38;
      if (lakeH(x, z) > WATER_Y - 0.25 || (x < DOCK_END + 0.7 && z > DOCK_Z0 - 0.8 && z < DOCK_Z1 + 0.8) || SPOTS.some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 1.7)) continue;
      if (pads.some(q => Math.hypot(q.x - x, q.z - z) < q.r + r + 0.15)) continue;
      pads.push({ x, z, r, a: R() * TAU });
    }
    {
      const im = new THREE.InstancedMesh(padShape, toon('#ffffff', { rim: 0.12 }), pads.length), m = new THREE.Matrix4(), cc = new THREE.Color();
      pads.forEach((q, i) => { m.compose(new THREE.Vector3(q.x, WATER_Y + 0.025, q.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, q.a, 0)), new THREE.Vector3(q.r, 0.03, q.r)); im.setMatrixAt(i, m); im.setColorAt(i, cc.set(P.pad[i % 3])); });
      im.receiveShadow = true; scene.add(im);
      const fl = [];
      pads.filter((q, i) => i % 5 === 2).forEach((q, j) => {
        const pink = j % 2 === 0, y = WATER_Y + 0.05;
        for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; fl.push({ geo: G.cone, m: M4(q.x + Math.cos(a) * 0.07, y + 0.06, q.z + Math.sin(a) * 0.07, 0.05, 0.16, 0.05, -a, 0, 0.5), color: pink ? '#f4a3c0' : '#fff2f6' }); }
        fl.push({ geo: G.sphere, m: M4(q.x, y + 0.06, q.z, 0.045), color: '#ffd447' });
      });
      if (fl.length) scene.add(new THREE.Mesh(merge(fl), toon('#ffffff', { vc: 1, rim: 0.25 })));
    }
    // the far shore: rounded trees and pines along it, into the mist
    {
      const pcs = [];
      for (let i = 0; i < 110; i++) {
        const a = -Math.PI * (R() * 1.15) - 0.05, d = 41 + R() * 16, x = 2 + (Math.cos(a) * d) / 0.85, z = -7 + Math.sin(a) * d, y = lakeH(x, z) - 0.3, s = 1.3 + R() * 1.3;
        if (y < WATER_Y) continue;
        if (R() < 0.5) {
          pcs.push({ geo: new THREE.ConeGeometry(1.5 * s, 4.2 * s, 7), m: M4(x, y + 2.3 * s, z, 1), color: P.farTree[i % 3] });
          pcs.push({ geo: new THREE.ConeGeometry(1.1 * s, 3 * s, 7), m: M4(x, y + 4.2 * s, z, 1), color: P.farTree[(i + 1) % 3] });
        } else pcs.push({ geo: G.ico, m: M4(x, y + 2.2 * s, z, 2.1 * s, 1.9 * s, 2.1 * s), color: P.farTree[(i + 2) % 3] });
      }
      const fg = merge(pcs); fg.computeVertexNormals();
      scene.add(new THREE.Mesh(fg, toon('#ffffff', { vc: 1, rim: 0 })));
    }
    // trees on the near bank, behind the dock's foot
    const swayers = [];
    for (let i = 0, n = 0; i < 60 && n < 11; i++) {
      const x = -12.5 - R() * 14, z = -16 + R() * 18;
      if (lakeH(x, z) < 0.2) continue;
      n++;
      const g = new THREE.Group(), s = 0.9 + R() * 0.5, TR = rng(i + 90);
      g.position.set(x, lakeH(x, z) - 0.1, z); g.scale.setScalar(s * 1.15); g.rotation.y = R() * TAU;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 2.4, 7), toon('#7f5a3c', { rim: 0.15 })); trunk.position.y = 1.2; trunk.castShadow = true; g.add(trunk);
      const pieces = [[0, 3.0, 0, 1.25], [0.9, 2.6, 0.3, 0.95], [-0.85, 2.7, -0.2, 1.0], [0.2, 3.7, -0.3, 0.9], [-0.3, 2.5, 0.85, 0.85]].map(([px, py, pz, pr], k) => ({ geo: G.ico, m: M4(px, py, pz, pr * (0.92 + TR() * 0.18)), color: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346'][k] }));
      const crown = new THREE.Mesh(merge(pieces), toon('#ffffff', { vc: 1, rim: 0.28 })); crown.castShadow = true;
      const pivot = new THREE.Group(); pivot.add(crown); g.add(pivot); scene.add(g);
      swayers.push({ o: pivot, ph: R() * 10, amp: 0.02 });
    }
    // rocks at the water's edge
    for (let i = 0; i < 9; i++) {
      const x = -8.2 - R() * 3, z = -12 + R() * 16;
      if (z > DOCK_Z0 - 0.7 && z < DOCK_Z1 + 0.7) continue;
      const s = 0.3 + R() * 0.55, m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), toon('#9a9c92', { rim: 0.2 }));
      m.position.set(x, Math.max(WATER_Y, lakeH(x, z)) + s * 0.15, z); m.scale.set(s * 1.15, s * 0.7, s); m.rotation.set(R(), R() * 7, R() * 3);
      m.castShadow = m.receiveShadow = true; scene.add(m);
    }
    // mist lying low over the far water, and a few clouds
    const mistTex = TK.canvasTex(128, 64, cx => { const g = cx.createRadialGradient(64, 32, 4, 64, 32, 62); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cx.setTransform(1, 0, 0, 0.5, 0, 16); cx.fillStyle = g; cx.fillRect(0, 0, 128, 128); });
    const mists = [];
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, color: '#f6fbfb', transparent: true, opacity: 0.5, depthWrite: false }));
      s.position.set(-30 + i * 8 + R() * 4, 1.4 + R() * 1.8, -24 - R() * 12); s.scale.set(26 + R() * 14, 5 + R() * 3, 1); scene.add(s);
      mists.push({ s, x0: s.position.x, ph: R() * TAU });
    }
    const clouds = [];
    for (let i = 0; i < 6; i++) {
      const CR = rng(i + 70), pcs = [];
      for (let k = 0; k < 6; k++) pcs.push({ geo: G.ico, m: M4((k - 2.5) * 3.4 + CR() * 2, CR() * 1.5, CR() * 3, 2.6 + CR() * 2.2, 1.4 + CR(), 2.3 + CR()), color: k % 2 ? '#ffffff' : '#f4f9fd' });
      const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 }));
      m.position.set(-150 + CR() * 300, 36 + CR() * 12, -150 + CR() * 110); scene.add(m); clouds.push(m);
    }
    // dragonflies over the water, and the Hush's wisps by the foes
    const motes = [];
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 3 ? '#9fe8ff' : '#c7ffd0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(0.17); scene.add(s);
      motes.push({ s, x: -6 + R() * 18, z: -9 + R() * 12, y: 0.4 + R() * 2.2, ph: R() * TAU, sp: 0.5 + R() * 0.8, kind: 'fly' });
    }
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.24); scene.add(s);
      const a = R() * TAU, d = 1.2 + R() * 3.2;
      motes.push({ s, x: 0, z: 0, y: R() * 3, ph: R() * TAU, sp: 0.35 + R() * 0.4, kind: 'hush', ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 });
    }
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      swayers.forEach(s => { s.o.rotation.z = Math.sin(t * 1.3 + s.ph) * s.amp; s.o.rotation.x = Math.sin(t * 0.9 + s.ph * 1.7) * s.amp * 0.6; });
      clouds.forEach(cl => { cl.position.x += dt * 1.0; if (cl.position.x > 160) cl.position.x = -160; });
      mists.forEach(m => { m.s.position.x = m.x0 + Math.sin(t * 0.05 + m.ph) * 6; });
      if (boat) boat.rotation.z = Math.sin(t * 0.8) * 0.025;
      for (const m of motes) {
        if (m.kind === 'fly') {
          // a dragonfly darts, hangs, darts again
          const ph = t * m.sp * 0.6 + m.ph, dart = Math.floor(ph), u = smoothstep(0, 0.25, ph - dart), sd = Math.round(m.ph * 100);
          const ax = m.x + (hash(dart * 7 + sd) - 0.5) * 3, az = m.z + (hash(dart * 13 + sd) - 0.5) * 2;
          const bx = m.x + (hash((dart + 1) * 7 + sd) - 0.5) * 3, bz = m.z + (hash((dart + 1) * 13 + sd) - 0.5) * 2;
          m.s.position.set(lerp(ax, bx, u), m.y + Math.sin(t * 7 + m.ph) * 0.04, lerp(az, bz, u));
          m.s.material.opacity = 0.75;
        } else {
          const k = ((t * m.sp * 0.25 + m.ph / TAU) % 1);
          m.s.position.set(stainC.x + m.ox + Math.sin(t + m.ph) * 0.3, k * 3.2, stainC.y + m.oz + Math.cos(t * 0.8 + m.ph) * 0.3);
          m.s.material.opacity = Math.sin(k * Math.PI) * 0.32 * uni.uStain.value;
        }
      }
    }
    // the ripple rings follow what floats in this fight (setup: [{ x, z, r }])
    const setRings = list => rings.forEach((v, i) => { const q = list[i]; if (q) v.set(q.x, q.z, q.r, 1); else v.set(0, 0, 0, 0); });
    return { scene, sun, uni, update, P, setRings, lake: true };
  }

  // ------------------------------------------------------------ the Corn Society's hall (place.biome 'cellar')
  // A round earthen cellar under the corn maze's scarecrow: a packed-earth floor strewn with straw, walls of earth with
  // corn stalks pressed against them, beams overhead, straw bales, banners with the Society's corn emblem, the colonel's
  // throne of husks at the back, torches and lanterns, a ladder up to the hatch, and Society members peeking out from
  // behind the bales. Walls and ceiling face inward, so a camera outside them (the intro shot) sees in.
  // uni.uHeat (0 → 1) makes the floor glow hot around the foes (the boss's second phase).
  const HALL = { x: 1.5, z: -1.2, r: 15, h: 9 };
  const strawTex = TK.canvasTex(64, 64, c => {
    c.fillStyle = '#d8b65c'; c.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 70; i++) { c.strokeStyle = i % 3 ? '#e9cd78' : '#b8954a'; c.lineWidth = 1 + (i % 2); const x = (i * 37) % 64, y = (i * 23) % 64; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14, y + 3 - (i % 5)); c.stroke(); }
  });
  strawTex.wrapS = strawTex.wrapT = THREE.RepeatWrapping;
  const emblemTex = TK.canvasTex(128, 256, c => {
    c.fillStyle = '#8f2f2a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(128, 0); c.lineTo(128, 220); c.lineTo(96, 250); c.lineTo(64, 220); c.lineTo(32, 250); c.lineTo(0, 220); c.closePath(); c.fill();
    c.strokeStyle = '#e8c45a'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#e8c45a'; c.beginPath(); c.arc(64, 96, 40, 0, TAU); c.fill();
    c.fillStyle = '#8f2f2a'; c.beginPath(); c.arc(64, 96, 33, 0, TAU); c.fill();
    c.fillStyle = '#f2cf55'; c.beginPath(); c.ellipse(64, 96, 13, 26, 0, 0, TAU); c.fill();                     // a corn cob…
    c.fillStyle = '#b8902c'; for (let r = 0; r < 6; r++) for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(64 + k * 6, 76 + r * 8, 1.6, 0, TAU); c.fill(); }
    c.fillStyle = '#7f9a3e'; c.beginPath(); c.moveTo(64, 126); c.quadraticCurveTo(36, 110, 40, 74); c.quadraticCurveTo(54, 100, 64, 112); c.fill();   // …in its husk
    c.beginPath(); c.moveTo(64, 126); c.quadraticCurveTo(92, 110, 88, 74); c.quadraticCurveTo(74, 100, 64, 112); c.fill();
  });
  function buildCellar() {
    const P = PAL.cellar, FN = 14, FF = 46;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, FN, FF);
    scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) }, uHeat: { value: 0 } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    // warm light from the open hatch above (it makes the shadows), and flickering torches and a lantern
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(4, 16, 8); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    const lights = [[-1.6, 2.7, -7.6, '#ffae55', 1.1], [10.0, 2.7, -6.6, '#ffae55', 1.1], [2.4, 4.4, 1.0, '#ffd08a', 0.5]].map(([x, y, z, c, i]) => {
      const l = new THREE.PointLight(c, i, 18, 1.4); l.position.set(x, y, z); scene.add(l); return { l, i, ph: Math.random() * 10 };
    });
    const R = rng(77);
    // the floor: packed earth, darker toward the walls, with the Hush stain and the heat
    const geo = new THREE.PlaneGeometry(40, 40, 90, 90); geo.rotateX(-Math.PI / 2); geo.translate(HALL.x, 0, HALL.z);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const EA = new THREE.Color(P.earth), ED = new THREE.Color(P.earthD), SW = new THREE.Color(P.straw);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x - HALL.x, z - HALL.z);
      c.copy(EA).lerp(ED, 0.5 + 0.5 * Math.sin(x * 0.7 + Math.cos(z * 0.5) * 2) * Math.sin(z * 0.6));
      c.lerp(SW, smoothstep(0.55, 0.95, Math.sin(x * 1.3 + z * 0.4) * Math.sin(z * 1.1 - x * 0.3)) * 0.35);
      c.lerp(ED, smoothstep(HALL.r - 4, HALL.r, d) * 0.6);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const gmat = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    gmat.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC; sh.uniforms.uHeat = uni.uHeat; sh.uniforms.uTime = uni.uTime;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; uniform float uHeat; uniform float uTime; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);\n' +
        'float hd = uHeat * (1.0 - smoothstep(0.8, 6.5, distance(vWPos.xz, uStainC)));\n' +
        'float crack = smoothstep(0.6, 0.97, abs(sin(vWPos.x * 2.9 + sin(vWPos.z * 2.1) * 1.8)) * abs(sin(vWPos.z * 2.6 - vWPos.x * 0.7)));\n' +
        'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.45, 0.14), hd * (0.3 + 0.55 * crack * (0.75 + 0.25 * sin(uTime * 4.0 + vWPos.x))));')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.36, 0.08) * uHeat * (1.0 - smoothstep(0.8, 6.5, distance(vWPos.xz, uStainC))) * 0.45;');
    };
    gmat.customProgramCacheKey = () => 'cellar-floor';
    const floor = new THREE.Mesh(geo, gmat); floor.receiveShadow = true; scene.add(floor);
    // straw strewn about (short blades), thicker by the walls
    const blades = [];
    for (let i = 0; i < 3200; i++) {
      const a = R() * TAU, d = Math.pow(R(), 0.6) * (HALL.r - 0.5), x = HALL.x + Math.cos(a) * d, z = HALL.z + Math.sin(a) * d;
      if (z > 2.6 && Math.abs(x - 0.5) < 9 && R() < 0.7) continue;
      blades.push({ x, y: -0.01, z, a: R(), h: 0.05 + R() * 0.1 + (d > HALL.r - 4 ? 0.12 : 0), w: 0.05 + R() * 0.03, c: R() });
    }
    scene.add(grassMesh(blades, P, uni, FN, FF));
    // the walls: earth in bands, darker low down
    {
      const wg = new THREE.CylinderGeometry(HALL.r, HALL.r + 0.8, HALL.h, 72, 8, true); wg.translate(HALL.x, HALL.h / 2 - 0.3, HALL.z);
      const wp = wg.attributes.position, wc = new Float32Array(wp.count * 3), A = new THREE.Color(P.wallA), Bc = new THREE.Color(P.wallB);
      for (let i = 0; i < wp.count; i++) {
        const x = wp.getX(i), y = wp.getY(i), z = wp.getZ(i);
        c.copy(A).lerp(Bc, 0.5 + 0.5 * Math.sin(y * 2.1 + Math.sin(Math.atan2(z - HALL.z, x - HALL.x) * 9) * 0.8)).multiplyScalar(0.75 + 0.25 * smoothstep(0, 4, y));
        wc.set([c.r, c.g, c.b], i * 3);
      }
      wg.setAttribute('color', new THREE.BufferAttribute(wc, 3));
      const wall = new THREE.Mesh(wg, new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, side: THREE.BackSide }));
      wall.receiveShadow = true; scene.add(wall);
      const ceil = new THREE.Mesh(new THREE.CircleGeometry(HALL.r + 1, 48).rotateX(Math.PI / 2), toon('#3a291d', { rim: 0 }));
      ceil.position.set(HALL.x, HALL.h - 0.3, HALL.z); scene.add(ceil);
    }
    // beams overhead; a ladder against the wall up to the hatch (a square of daylight), with a shaft of light coming down
    {
      const pcs = [];
      for (let k = -3; k <= 3; k++) pcs.push({ geo: G.box, m: M4(HALL.x, HALL.h - 0.65, HALL.z + k * 3.6, HALL.r * 2, 0.4, 0.45), color: k % 2 ? '#5a4030' : '#634634' });
      for (const k of [-1, 1]) pcs.push({ geo: G.box, m: M4(HALL.x + k * 5, HALL.h - 1.0, HALL.z, 0.45, 0.35, HALL.r * 2), color: '#4e382a' });
      const beams = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.12 })); beams.castShadow = true; scene.add(beams);
      const a = -2.1, top = HALL.h - 0.6, ladder = new THREE.Group();
      ladder.position.set(HALL.x + Math.cos(a) * (HALL.r - 1.6), 0, HALL.z + Math.sin(a) * (HALL.r - 1.6)); ladder.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));   // (its back, local −z, to the wall)
      scene.add(ladder);
      const lean = new THREE.Group(); lean.rotation.x = -0.17; ladder.add(lean);              // it leans back against the wall
      for (const s of [-1, 1]) lean.add(part(G.box, '#8b6340', [s * 0.36, top / 2, 0], [0.1, top + 0.3, 0.1], { ink: 0.008 }));
      for (let k = 0; k < 13; k++) lean.add(part(G.box, '#9a7450', [0, 0.5 + k * 0.62, 0], [0.82, 0.07, 0.07], { ink: 0 }));
      const hatch = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff4cf', fog: false }));
      hatch.position.set(0, HALL.h - 0.32, -top * 0.17 - 0.5); ladder.add(hatch);
      const shaftTex = TK.canvasTex(32, 128, cx => { const g = cx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,240,200,0.5)'); g.addColorStop(1, 'rgba(255,240,200,0)'); cx.fillStyle = g; cx.fillRect(0, 0, 32, 128); });
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.3, HALL.h), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      shaft.position.set(0, HALL.h / 2 - 0.3, -top * 0.17 + 0.2); shaft.rotation.y = Math.PI / 2; ladder.add(shaft);
    }
    // corn stalks pressed against the walls (one instanced stalk: a stem, leaves, a cob in its husk, a tassel)
    {
      const pcs = [{ geo: G.cyl, m: M4(0, 2.1, 0, 0.06, 4.2, 0.06), color: '#9aa752' }];
      [[1.1, 1], [1.8, -1], [2.5, 1], [3.1, -1], [3.6, 1]].forEach(([y, s], i) => pcs.push({ geo: G.sphere, m: M4(s * 0.22, y, 0, 0.07, 0.72, 0.022, 0, 0, s * 0.95), color: i % 2 ? '#a9b65c' : '#8f9c48' }));
      pcs.push({ geo: G.sphere, m: M4(0.1, 2.3, 0.08, 0.11, 0.32, 0.11, 0, 0, -0.3), color: '#e9c45a' });
      pcs.push({ geo: G.sphere, m: M4(0.13, 2.2, 0.08, 0.13, 0.3, 0.12, 0, 0, -0.3), color: '#b9c27a' });
      pcs.push({ geo: G.cone, m: M4(0, 4.35, 0, 0.12, 0.42, 0.12), color: '#d6b35a' });
      const sg = merge(pcs), n = 84, im = new THREE.InstancedMesh(sg, toon('#ffffff', { vc: 1, rim: 0.12 }), n), m = new THREE.Matrix4();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + R() * 0.05, d = HALL.r - 0.35 - R() * 0.5, s = 0.85 + R() * 0.45;
        m.compose(new THREE.Vector3(HALL.x + Math.cos(a) * d, -0.05, HALL.z + Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler((R() - 0.5) * 0.12, R() * TAU, (R() - 0.5) * 0.12)), new THREE.Vector3(s, s * (0.9 + R() * 0.3), s));
        im.setMatrixAt(i, m);
      }
      scene.add(im);
    }
    // straw bales stacked by the walls
    {
      const bales = new THREE.Group();
      const baleMat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, map: strawTex });
      for (const [x, z, r, n] of [[-8.6, -5.6, 0.35, 2], [-10.2, -2.2, 1.2, 1], [-9.2, 1.6, 1.4, 1], [10.6, -4.0, -0.4, 2], [12.0, -0.6, -1.2, 1], [6.8, -8.2, 0.1, 1], [-3.6, -8.6, -0.2, 1]]) {
        for (let k = 0; k < n; k++) {
          const b = new THREE.Mesh(G.box, baleMat); b.scale.set(1.5, 0.75, 0.85); b.position.set(x + k * 0.15, 0.37 + k * 0.75, z); b.rotation.y = r + k * 0.25;
          b.castShadow = b.receiveShadow = true; bales.add(b);
          for (const dd of [-0.38, 0.38]) { const t = new THREE.Mesh(G.box, toon('#7a5a36', { rim: 0 })); t.scale.set(0.05, 0.77, 0.87); t.position.copy(b.position).add(new THREE.Vector3(Math.cos(b.rotation.y) * dd, 0, -Math.sin(b.rotation.y) * dd)); t.rotation.y = b.rotation.y; bales.add(t); }
        }
      }
      scene.add(bales);
    }
    // the colonel's throne of husks, behind his spot, between two torches; banners with the corn emblem behind it
    const flames = [], banners = [];
    {
      const tx = 4.4, tz = -5.6, pcs = [];
      pcs.push({ geo: G.cyl, m: M4(tx, 0.15, tz, 1.5, 0.3, 1.3), color: '#5c4230' });
      pcs.push({ geo: G.box, m: M4(tx, 0.62, tz + 0.1, 1.5, 0.45, 1.05), color: '#c7cf88' });
      for (let k = -3; k <= 3; k++) pcs.push({ geo: G.sphere, m: M4(tx + k * 0.24, 1.75 - Math.abs(k) * 0.12, tz - 0.45, 0.26, 1.35 - Math.abs(k) * 0.12, 0.07, 0, -0.12, -k * 0.16), color: k % 2 ? '#b5bf72' : '#c7cf88' });
      for (const s of [-1, 1]) {
        pcs.push({ geo: G.sphere, m: M4(tx + s * 0.85, 1.0, tz + 0.15, 0.17, 0.17, 0.62), color: '#e9c45a' });
        pcs.push({ geo: G.cyl, m: M4(tx + s * 0.85, 0.65, tz + 0.15, 0.1, 0.6, 0.1), color: '#8b6340' });
      }
      pcs.push({ geo: G.cyl, m: M4(tx, 3.15, tz - 0.48, 0.34, 0.06, 0.34, 0, Math.PI / 2 - 0.12), color: '#e8c45a' });
      const throne = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.22 })); throne.castShadow = throne.receiveShadow = true; scene.add(throne);
      // torches on posts, each with a fire (two sprites) and its light
      const flameTex = TK.canvasTex(64, 96, cx => { const g = cx.createRadialGradient(32, 64, 2, 32, 56, 34); g.addColorStop(0, 'rgba(255,248,210,1)'); g.addColorStop(0.45, 'rgba(255,190,80,0.95)'); g.addColorStop(1, 'rgba(255,90,20,0)'); cx.fillStyle = g; cx.beginPath(); cx.moveTo(32, 2); cx.quadraticCurveTo(64, 60, 32, 94); cx.quadraticCurveTo(0, 60, 32, 2); cx.fill(); });
      [[lights[0].l.position.x, lights[0].l.position.z], [lights[1].l.position.x, lights[1].l.position.z]].forEach(([x, z]) => {
        const post = new THREE.Group(); post.position.set(x, 0, z); scene.add(post);
        post.add(part(G.cyl, '#6b4a30', [0, 1.1, 0], [0.08, 2.2, 0.08], { ink: 0.01 }));
        post.add(part(G.cyl, '#3d3a3a', [0, 2.25, 0], [0.2, 0.14, 0.2], { ink: 0.01 }));
        for (const [s, cc] of [[1, '#ffb05a'], [0.6, '#fff1c2']]) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: cc, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
          sp.position.set(0, 2.62, 0); sp.scale.set(0.55 * s, 0.85 * s, 1); post.add(sp); flames.push({ sp, s, ph: Math.random() * 10 });
        }
      });
      // banners hanging from a rail behind the throne
      const rail = part(G.cyl, '#5a4030', [tx, 4.3, tz - 1.6], [0.06, 9.5, 0.06], { rot: [0, 0, Math.PI / 2], ink: 0.01 }); scene.add(rail);
      [-3.2, 0, 3.2].forEach((dx, i) => {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.9), new THREE.MeshToonMaterial({ map: emblemTex, gradientMap: TK.grad, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
        b.geometry.translate(0, -1.45, 0);
        b.position.set(tx + dx, 4.25, tz - 1.55); scene.add(b); banners.push({ b, ph: i * 1.7 });
      });
    }
    // lanterns on posts at the sides of the hall
    for (const [x, z] of [[-7.4, -1.6], [10.6, 1.4]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      g.add(part(G.cyl, '#6b4a30', [0, 1.4, 0], [0.07, 2.8, 0.07], { ink: 0.01 }));
      g.add(part(G.box, '#3d3a3a', [0, 2.95, 0], [0.32, 0.4, 0.32], { ink: 0.012 }));
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc46b', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      gl.position.set(0, 2.95, 0); gl.scale.setScalar(1.3); g.add(gl); flames.push({ sp: gl, s: 1.3, ph: Math.random() * 10, glow: true });
    }
    // members of the Society, peeking out from behind the bales and the throne (they whisper; the Hush can't take that)
    const watchers = [];
    for (const [x, z, color, yaw] of [[-8.0, -4.6, 'yellow', 0.9], [-9.4, -1.1, 'white', 1.2], [9.8, -3.0, 'red', -0.9], [11.2, 0.4, 'blue', -1.2], [6.2, -7.2, 'white', -0.4], [2.6, -6.6, 'yellow', 0.3]]) {
      const h = _.M.build({ kind: 'kernel', color, size: 'small' });
      h.root.position.set(x, 0, z); h.root.rotation.y = yaw; h.root.scale.setScalar(0.62); scene.add(h.root);
      watchers.push({ h, F: { states: new Set(), mood: 'idle', face: null, sx: 1, sy: 1, tilt: 0, lean: 0, seed: R() * 10, vy: 0, talk: 0, alive: true, calmed: false, shy: true, weakShown: false, down: 0 }, z0: z, x0: x });
    }
    // dust in the torchlight, and the Hush's wisps by the foes
    const motes = [];
    for (let i = 0; i < 26; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffd59a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(0.12); scene.add(s);
      motes.push({ s, x: -8 + R() * 18, z: -8 + R() * 10, y: 0.5 + R() * 4, ph: R() * TAU, sp: 0.2 + R() * 0.3, kind: 'fly' });
    }
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false }));
      s.scale.setScalar(0.24); scene.add(s);
      const a = R() * TAU, d = 1.2 + R() * 3.2;
      motes.push({ s, x: 0, z: 0, y: R() * 3, ph: R() * TAU, sp: 0.35 + R() * 0.4, kind: 'hush', ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 });
    }
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      lights.forEach(L => { L.l.intensity = L.i * (0.86 + 0.14 * Math.sin(t * 13 + L.ph) * Math.sin(t * 7.3 + L.ph * 2)) * (1 + uni.uHeat.value * 0.25); });
      flames.forEach(f => { const k = 1 + Math.sin(t * 11 + f.ph) * 0.08 + Math.sin(t * 17 + f.ph * 2) * 0.05; if (f.glow) f.sp.material.opacity = 0.7 + Math.sin(t * 9 + f.ph) * 0.12; else f.sp.scale.set(0.55 * f.s * k, 0.85 * f.s * (2 - k), 1); });
      banners.forEach(b => { b.b.rotation.x = Math.sin(t * 0.8 + b.ph) * 0.04; });
      watchers.forEach(w => { w.h.root.position.x = w.x0 + Math.sin(t * 0.5 + w.F.seed) * 0.08; w.F.talk = (t * 0.4 + w.F.seed) % 4 < 0.6 ? 1 : 0; _.M.pose(w.h, w.F, t, Math.max(dt, 1e-4)); });
      for (const m of motes) {
        if (m.kind === 'fly') { m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 0.8, m.y + Math.sin(t * m.sp * 0.7 + m.ph) * 0.4, m.z + Math.cos(t * m.sp * 0.6 + m.ph) * 0.6); m.s.material.opacity = 0.35 + 0.25 * Math.sin(t * 1.5 + m.ph); }
        else {
          const k = ((t * m.sp * 0.25 + m.ph / TAU) % 1);
          m.s.position.set(stainC.x + m.ox + Math.sin(t + m.ph) * 0.3, k * 3.2, stainC.y + m.oz + Math.cos(t * 0.8 + m.ph) * 0.3);
          m.s.material.opacity = Math.sin(k * Math.PI) * 0.32 * uni.uStain.value;
        }
      }
    }
    return { scene, sun, uni, update, P, cellar: true };
  }

  // ------------------------------------------------------------ the Quarry Caves' cavern (place.biome 'cave'; region 3, caves.js / mine.js)
  // A round cavern of rock in bands, a ceiling of stalactites, crystals round the walls (violet and teal, glowing), timber
  // supports, a rail track with a minecart, a lantern, and a shaft of daylight from a crack above. Walls and ceiling face
  // inward, so the wide intro shot sees in from outside. arena.flash(): when Mimo sings, the crystals flare up and the cavern
  // brightens for a moment.
  PAL.cave = { fog: '#141120', hemiSky: '#a99de0', hemiGround: '#3a3045', sun: '#d8ceff', hemiI: 0.62, sunI: 0.5, rockA: '#5f564d', rockB: '#71675c', rockD: '#3f3832' };
  function buildCave() {
    const P = PAL.cave, FN = 14, FF = 48, HC = { x: 1.5, z: -1.2, r: 15, h: 9.5 };
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, FN, FF);
    scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI); scene.add(hemi);
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(3, 18, 6); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    const lights = [[-4.2, 2.4, -6.8, '#a58cff', 1.0], [9.2, 2.2, -5.4, '#6ff0e0', 0.9], [-7.8, 2.6, 2.0, '#ffb35a', 0.9]].map(([x, y, z, c, i]) => {
      const l = new THREE.PointLight(c, i, 17, 1.4); l.position.set(x, y, z); scene.add(l); return { l, i, ph: Math.random() * 10 };
    });
    const R = rng(4242), c = new THREE.Color();
    // the floor: rock and grit in bands, darker toward the walls, with the Hush's gray stain round the foes
    const geo = new THREE.PlaneGeometry(40, 40, 90, 90); geo.rotateX(-Math.PI / 2); geo.translate(HC.x, 0, HC.z);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), A = new THREE.Color(P.rockA), Bc = new THREE.Color(P.rockB), D = new THREE.Color(P.rockD);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x - HC.x, z - HC.z);
      c.copy(A).lerp(Bc, 0.5 + 0.5 * Math.sin(x * 0.9 + Math.cos(z * 0.7) * 2) * Math.sin(z * 0.8));
      c.lerp(D, smoothstep(HC.r - 5, HC.r, d) * 0.7);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const gmat = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    gmat.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 7.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    gmat.customProgramCacheKey = () => 'cave-floor';
    const floor = new THREE.Mesh(geo, gmat); floor.receiveShadow = true; scene.add(floor);
    // the walls (rock in bands, lighter strata) and the ceiling
    {
      const wg = new THREE.CylinderGeometry(HC.r, HC.r + 1.2, HC.h, 72, 8, true); wg.translate(HC.x, HC.h / 2 - 0.3, HC.z);
      const wp = wg.attributes.position, wc = new Float32Array(wp.count * 3);
      for (let i = 0; i < wp.count; i++) {
        const x = wp.getX(i), y = wp.getY(i), z = wp.getZ(i);
        c.copy(A).lerp(Bc, 0.5 + 0.5 * Math.sin(y * 2.4 + Math.sin(Math.atan2(z - HC.z, x - HC.x) * 7) * 0.9)).multiplyScalar(0.7 + 0.3 * smoothstep(0, 5, y));
        wc.set([c.r, c.g, c.b], i * 3);
      }
      wg.setAttribute('color', new THREE.BufferAttribute(wc, 3));
      const wall = new THREE.Mesh(wg, new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, side: THREE.BackSide })); wall.receiveShadow = true; scene.add(wall);
      const ceil = new THREE.Mesh(new THREE.CircleGeometry(HC.r + 1.4, 48).rotateX(Math.PI / 2), toon('#2e2832', { rim: 0 })); ceil.position.set(HC.x, HC.h - 0.3, HC.z); scene.add(ceil);
    }
    // stalactites and stalagmites, timber supports, rubble, the rails and a minecart (one merged mesh)
    const pcs = [];
    for (let i = 0; i < 46; i++) { const a = R() * TAU, d = 3 + Math.sqrt(R()) * (HC.r - 4), s = 0.25 + R() * 0.45; pcs.push({ geo: G.cone, m: M4(HC.x + Math.cos(a) * d, HC.h - 0.3 - s * 1.6, HC.z + Math.sin(a) * d, s, -s * 3.4, s), color: R() < 0.5 ? '#5f564d' : '#6a6157' }); }
    for (let i = 0; i < 16; i++) { const a = R() * TAU, d = HC.r - 1.2 - R() * 2.5, s = 0.25 + R() * 0.5; if (Math.sin(a) > 0.55) continue; pcs.push({ geo: G.cone, m: M4(HC.x + Math.cos(a) * d, s * 1.2, HC.z + Math.sin(a) * d, s, s * 2.6, s), color: '#5f564d' }); }
    for (const a of [-2.3, -1.6, -0.9, -0.2, 2.6, 3.3]) {
      const x = HC.x + Math.cos(a) * (HC.r - 0.9), z = HC.z + Math.sin(a) * (HC.r - 0.9), ry = -a + Math.PI / 2;
      pcs.push({ geo: G.cyl, m: M4(x - Math.sin(ry) * 1.2, 2.3, z - Math.cos(ry) * 1.2, 0.17, 4.6, 0.17), color: '#6b4a30' });
      pcs.push({ geo: G.cyl, m: M4(x + Math.sin(ry) * 1.2, 2.3, z + Math.cos(ry) * 1.2, 0.17, 4.6, 0.17), color: '#6b4a30' });
      pcs.push({ geo: G.box, m: M4(x, 4.6, z, 2.9, 0.3, 0.32, ry), color: '#5a3a24' });
    }
    for (let i = 0; i < 30; i++) { const a = R() * TAU, d = HC.r - 1 - R() * 3, s = 0.2 + R() * 0.45; if (Math.sin(a) > 0.5) continue; pcs.push({ geo: G.ico0, m: M4(HC.x + Math.cos(a) * d, s * 0.3, HC.z + Math.sin(a) * d, s * 1.2, s * 0.8, s, R() * 6), color: R() < 0.5 ? '#6a6157' : '#5f564d' }); }
    for (let k = 0; k < 15; k++) { const x = -10.5 + k * 0.75; pcs.push({ geo: G.box, m: M4(x, 0.05, -8.6, 0.28, 0.1, 1.5), color: '#6b4a30' }); }
    for (const o of [-0.5, 0.5]) pcs.push({ geo: G.box, m: M4(-5.3, 0.16, -8.6 + o, 11.2, 0.1, 0.08), color: '#7d8590' });
    pcs.push({ geo: G.box, m: M4(-6.6, 0.75, -8.6, 1.35, 0.72, 1.0), color: '#5d6470' }, { geo: G.box, m: M4(-6.6, 1.13, -8.6, 1.43, 0.08, 1.08), color: '#454b55' });
    for (let i = 0; i < 5; i++) pcs.push({ geo: G.ico0, m: M4(-6.9 + (i % 3) * 0.28, 1.2, -8.75 + (i > 2 ? 0.3 : 0), 0.22, 0.18, 0.2, i), color: '#9a958c' });
    const rocks = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.14 })); rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);
    // crystal clusters round the walls: their own glowing material, and a glow each
    const cpcs = [], glows = [], cols = ['#9b8fd8', '#7fe0d8', '#c9a2ff', '#8fd0ff'];
    for (const a of [-2.75, -2.05, -1.25, -0.55, 0.15, 2.95, 3.6, 2.35]) {
      const d = HC.r - 1.6, x = HC.x + Math.cos(a) * d, z = HC.z + Math.sin(a) * d, h = 1.0 + R() * 1.3;
      cpcs.push({ geo: G.ico0, m: M4(x, h * 0.45, z, 0.26, h * 0.6, 0.26, 0, (R() - 0.5) * 0.4, (R() - 0.5) * 0.4), color: cols[(R() * 4) | 0] });
      for (let i = 0; i < 3; i++) { const b = R() * TAU, hh = h * (0.4 + R() * 0.3); cpcs.push({ geo: G.ico0, m: M4(x + Math.cos(b) * 0.35, hh * 0.4, z + Math.sin(b) * 0.3, 0.15, hh * 0.55, 0.15, 0, Math.sin(b) * 0.5, Math.cos(b) * 0.5), color: cols[(R() * 4) | 0] }); }
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#a99cff', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(2.4 + h); gl.position.set(x, h * 0.6, z); scene.add(gl); glows.push(gl);
    }
    const cmat = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#2a1f55') });
    const crys = new THREE.Mesh(merge(cpcs, true), cmat); crys.castShadow = true; scene.add(crys);
    // a lantern on a post by the rails, and the shaft of daylight from the crack above
    const post = new THREE.Group(); post.position.set(-7.8, 0, 2.0); scene.add(post);
    post.add(part(G.cyl, '#6b4a30', [0, 1.3, 0], [0.07, 2.6, 0.07], { ink: 0.01 })); post.add(part(G.box, '#3d3a3a', [0, 2.75, 0], [0.32, 0.4, 0.32], { ink: 0.012 }));
    const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc46b', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })); lg.position.set(0, 2.75, 0); lg.scale.setScalar(1.3); post.add(lg);
    const shaftTex = TK.canvasTex(32, 128, cx => {
      const g = cx.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(230,225,255,0.45)'); g.addColorStop(1, 'rgba(230,225,255,0)'); cx.fillStyle = g; cx.fillRect(0, 0, 32, 128);
      // soft sides too, so the beam never shows as a hard-edged panel
      const s = cx.createLinearGradient(0, 0, 32, 0); s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(0.4, 'rgba(0,0,0,1)'); s.addColorStop(0.6, 'rgba(0,0,0,1)'); s.addColorStop(1, 'rgba(0,0,0,0)');
      cx.globalCompositeOperation = 'destination-in'; cx.fillStyle = s; cx.fillRect(0, 0, 32, 128);
    });
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(3.2, HC.h), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    shaft.position.set(2.2, HC.h / 2 - 0.3, -1.4); shaft.rotation.set(0, 0.6, 0.18); scene.add(shaft);
    // dust in the light
    const motes = [];
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#d8ceff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(0.12); scene.add(s); motes.push({ s, x: -6 + R() * 14, z: -6 + R() * 8, y: 0.5 + R() * 5, ph: R() * TAU, sp: 0.2 + R() * 0.3 }); }
    let flash = 0;
    function update(t, dt) {
      uni.uTime.value = t;
      flash = Math.max(0, flash - dt * 0.8);
      lights.forEach(L => { L.l.intensity = L.i * (0.85 + 0.15 * Math.sin(t * 2.2 + L.ph)) * (1 + flash * 1.4); });
      hemi.intensity = P.hemiI * (1 + flash * 0.7);
      cmat.emissive.setRGB(0.16 + 0.5 * flash, 0.12 + 0.4 * flash, 0.33 + 0.5 * flash).multiplyScalar(0.85 + 0.15 * Math.sin(t * 2.4));
      glows.forEach((g, i) => { g.material.opacity = (0.4 + 0.15 * Math.sin(t * 2 + i)) * (1 + flash * 1.2); });
      lg.material.opacity = 0.75 + Math.sin(t * 9) * 0.1;
      for (const m of motes) { m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 0.8, m.y + Math.sin(t * m.sp * 0.7 + m.ph) * 0.4, m.z + Math.cos(t * m.sp * 0.6 + m.ph) * 0.6); m.s.material.opacity = 0.3 + 0.2 * Math.sin(t * 1.5 + m.ph); }
    }
    return { scene, sun, uni, update, P, cave: true, flash() { flash = 1; } };
  }

  // ------------------------------------------------------------ the stage singleton
  const S = {
    arenas: {}, arena: null, scene: null, camera: new THREE.PerspectiveCamera(36, 16 / 9, 0.1, 400), t: 0, biome: 'meadow',
    cast: null, foes: [], stones: [], fx: null, extra: [], perches: [], props: [], rect: { left: 0, top: 0, width: 1280, height: 720 },
  };
  const blob = r => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 22), new THREE.MeshBasicMaterial({ color: '#203018', transparent: true, opacity: 0.24, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.renderOrder = 1; return m; };
  const spring = (x = 0) => ({ x, v: 0 });
  function stepSpring(s, target, k, d, dt) { s.v += ((target - s.x) * k - s.v * d) * dt; s.x += s.v * dt; return s.x; }

  // state objects for the cast: flow.js tweens these
  function actorState(kind, x, z, yaw, o) {
    return Object.assign({ kind, x, z, y: 0, hx: x, hz: z, yaw, baseYaw: yaw, sx: 1, sy: 1, lean: 0, tilt: 0, mood: 'idle', moodUntil: 0, look: 0, point: 0, cheer: 0,
      talk: 0, flash: 0, glow: 0, hidden: false, seed: Math.random() * 10, vy: 0, py: 0 }, o || {});
  }
  function initCast() {
    if (S.cast) return S.cast;
    const you = ACTORS.hero(), mimo = ACTORS.mimo(), coach = ACTORS.villager('coach');
    S.cast = {
      you: { model: you, shadow: blob(0.42), st: null },
      mimo: { model: mimo, shadow: blob(0.32), st: null, ears: [spring(0.12), spring(0.12)], earBack: [spring(0.1), spring(0.1)] },
      coach: { model: coach, shadow: blob(0.5), st: null },
    };
    return S.cast;
  }

  const PARTY = { you: [-3.5, 0.75], mimo: [-2.0, 0.2], coach: [-5.5, 0.05] };
  const SLOTS = { 1: [[2.4, 0.2]], 2: [[1.75, 0.75], [3.75, -0.15]], 3: [[1.6, 1.0], [3.1, 0.0], [4.5, -0.9]] };
  // ------------------------------------------------------------ what the foes stand on at the lake (one per foe, made per fight)
  // A lily pad (frogs sit on these, moths hover over them, some with a flower) or a little raft of lashed logs.
  // Their tops are at y = 0, so the foes stand on them as on the ground; they bob, and dip when someone lands.
  function lilyPad(r, flower) {
    const g = new THREE.Group();
    g.add(part(padShape, '#5aa84a', [0, 0, 0], [r, 0.06, r], { ink: 0.01, rim: 0.14 }));
    const veins = [];
    for (let i = 0; i < 7; i++) { const a = 0.55 + (i / 6) * (TAU - 1.1); veins.push({ geo: G.box, m: M4(Math.sin(a) * r * 0.45, 0.004, Math.cos(a) * r * 0.45, 0.025, 0.012, r * 0.82, a), color: '#3f8a3a' }); }
    veins.push({ geo: G.cyl, m: M4(0, 0.004, 0, r * 0.1, 0.012, r * 0.1), color: '#3f8a3a' });
    if (flower) {
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; veins.push({ geo: G.cone, m: M4(-r * 0.62 + Math.cos(a) * 0.08, 0.07, -r * 0.3 + Math.sin(a) * 0.08, 0.06, 0.2, 0.06, -a, 0, 0.55), color: '#f6a9c5' }); }
      veins.push({ geo: G.sphere, m: M4(-r * 0.62, 0.08, -r * 0.3, 0.055), color: '#ffd447' });
    }
    const m = new THREE.Mesh(merge(veins), toon('#ffffff', { vc: 1, rim: 0.15 })); m.receiveShadow = true; g.add(m);
    g.children[0].receiveShadow = true;
    return g;
  }
  function raft(r) {
    const pcs = [], n = 4, w = (r * 2) / n;
    for (let i = 0; i < n; i++) pcs.push({ geo: G.cyl, m: M4(0, 0.01 - w * 0.52, -r + w * (i + 0.5), w * 0.52, r * 2.05, w * 0.52, 0, 0, Math.PI / 2), color: i % 2 ? '#9a7048' : '#a77b52' });
    for (const x of [-r * 0.62, r * 0.62]) pcs.push({ geo: G.box, m: M4(x, 0.0, 0, 0.16, 0.05, r * 2.1), color: '#7a5a3e' });
    for (const x of [-r * 0.62, r * 0.62]) for (const z of [-r * 0.7, r * 0.7]) pcs.push({ geo: new THREE.TorusGeometry(0.06, 0.02, 5, 10), m: M4(x, 0.02, z, 1, 1, 1, 0, Math.PI / 2), color: '#d8c79b' });
    const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 })); m.castShadow = m.receiveShadow = true;
    const g = new THREE.Group(); g.add(m);
    return g;
  }
  function placePerches(sc) {
    for (const p of S.perches) sc.remove(p.obj);
    S.perches = [];
    if (S.biome !== 'lake') return;
    const R = rng(Math.floor(Math.random() * 1e6));
    S.foes.forEach((F, i) => {
      const pad = F.species === 'frog' || F.floating, r = Math.max(pad ? 0.85 : 0.8, F.radius + 0.5);
      const obj = pad ? lilyPad(r, F.floating || (F.species === 'frog' && i % 2 === 1)) : raft(r);
      obj.position.set(F.hx, 0, F.hz); obj.rotation.y = pad ? 1.2 + R() * 2.4 : 0.15 + (R() - 0.5) * 0.4;
      sc.add(obj);
      S.perches.push({ obj, x: F.hx, z: F.hz, r, dip: 0, ph: R() * TAU });
    });
    if (S.arena.setRings) S.arena.setRings(S.perches.map(p => ({ x: p.x, z: p.z, r: p.r })));
  }
  // ------------------------------------------------------------ Bruno's training yard (practice): props for one fight
  // A rail fence in an arc behind the dummies, an archery target on its stand, hay bales and a rack of wooden swords.
  function placeYard(sc, on) {
    for (const p of S.props) sc.remove(p);
    S.props = [];
    if (!on) return;
    const add = o => { sc.add(o); S.props.push(o); return o; };
    const pcs = [], wood = ['#9a7450', '#8e6a48', '#a57d57'];
    const fence = [];
    for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.04 + (i / 14) * 0.92); fence.push([2.6 + Math.cos(a) * 7.2, Math.sin(a) * 4.6 - 1.2]); }
    fence.forEach(([x, z], i) => {
      const y = groundH(x, z);
      pcs.push({ geo: G.cyl, m: M4(x, y + 0.5, z, 0.09, 1.0, 0.09), color: wood[i % 3] });
      pcs.push({ geo: G.cone, m: M4(x, y + 1.05, z, 0.1, 0.12, 0.1), color: wood[(i + 1) % 3] });
      if (i) {
        const [px, pz] = fence[i - 1], py = groundH(px, pz), len = Math.hypot(x - px, z - pz), ang = Math.atan2(x - px, z - pz);
        for (const h of [0.42, 0.8]) pcs.push({ geo: G.box, m: M4((x + px) / 2, (y + py) / 2 + h, (z + pz) / 2, 0.07, 0.11, len + 0.12, ang), color: wood[(i + 2) % 3] });
      }
    });
    // hay bales (one stacked), with their twine
    for (const [x, z, r, stack] of [[-6.6, -2.4, 0.4, 1], [7.1, 1.4, -0.3, 0], [-7.6, -0.6, 1.2, 0]]) {
      for (let k = 0; k <= stack; k++) {
        const y = groundH(x, z) + 0.33 + k * 0.62;
        pcs.push({ geo: G.box, m: M4(x + k * 0.1, y, z, 1.25, 0.62, 0.7, r + k * 0.3), color: k ? '#e6c86e' : '#dcbd62' });
        for (const d of [-0.3, 0.3]) pcs.push({ geo: G.box, m: M4(x + k * 0.1 + Math.cos(r + k * 0.3) * d, y, z - Math.sin(r + k * 0.3) * d, 0.04, 0.64, 0.72, r + k * 0.3), color: '#8a6a42' });
      }
    }
    // a rack of wooden practice swords
    { const x = 6.8, z = -2.6, y = groundH(x, z);
      for (const dx of [-0.6, 0.6]) pcs.push({ geo: G.cyl, m: M4(x + dx, y + 0.55, z, 0.06, 1.1, 0.06), color: '#7a5a3e' });
      pcs.push({ geo: G.box, m: M4(x, y + 1.0, z, 1.35, 0.08, 0.1), color: '#8a6440' });
      for (let k = 0; k < 4; k++) { const sx = x - 0.45 + k * 0.3; pcs.push({ geo: G.box, m: M4(sx, y + 0.62, z + 0.06, 0.07, 0.9, 0.03, 0, 0.08), color: '#c49a64' }); pcs.push({ geo: G.box, m: M4(sx, y + 0.92, z + 0.06, 0.2, 0.04, 0.05), color: '#6b4a30' }); } }
    const mesh = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 })); mesh.castShadow = mesh.receiveShadow = true; add(mesh);
    // the archery target on its stand, off to the right
    const tg = new THREE.Group(); tg.position.set(7.4, groundH(7.4, -0.6), -0.6); tg.rotation.y = -0.9; add(tg);
    [[-0.35, 0.2], [0.35, 0.2], [0, -0.35]].forEach(([dx, dz]) => tg.add(part(G.cyl, '#8a6440', [dx * 0.6, 0.65, dz * 0.6 - 0.1], [0.04, 1.35, 0.04], { rot: [dz * 0.5, 0, -dx * 0.5], ink: 0.008 })));
    [[0.62, '#f4efe2'], [0.5, '#3b3a44'], [0.38, '#4c7fd8'], [0.26, '#e2574c'], [0.13, '#f2c94c']].forEach(([r, c], i) => tg.add(part(G.cyl, c, [0, 1.15, 0.06 + i * 0.012], [r, 0.04, r], { rot: [Math.PI / 2 - 0.15, 0, 0], ink: i ? 0 : 0.012 })));
    tg.add(part(G.cyl, '#7a5a3e', [0.12, 1.25, 0.25], [0.012, 0.42, 0.012], { rot: [1.2, 0.3, 0], ink: 0.004 }));   // an arrow, stuck in it
  }
  // the Corn Society's colonel stands back by his throne; his soldiers stand in the usual row in front of him
  const BOSS_SPOT = [3.9, -2.6];
  const shadowR = h => (h.kind === 'moth' || h.kind === 'bat' ? 0.36 : h.kind === 'beetle' ? 0.5 : h.kind === 'frog' ? 0.46 : h.kind === 'colonel' ? 0.5 : 0.42) * h.scale;
  // one foe: its model and its state (flow.js tweens the state), at home on (x, z) once it has come in (it starts 7
  // units to the right, for hopIn). species: 'hushling' | 'hushbig' | 'moth' | 'beetle' | 'armadillo' | 'frog' | 'dummy' |
  // 'kernel' | 'popcorn' | 'colonel' (flow.js normFoe has already sorted the kind out). An armadillo fights curled up in a
  // ball (curl 1): its head and tail are tucked away until it's on its back.
  function makeFoe(spec, x, z) {
    const h = _.M.build({ kind: spec.kind, color: spec.color, size: spec.size, giant: spec.giant });     // (giant: a snowball boss is a snowman)
    if (spec.giant) { const k = +spec.giant || 2; h.root.scale.multiplyScalar(k); h.scale *= k; h.radius *= k; h.height *= k; }     // (a boss-sized one: the Mirror Lake's giant frog, isle.js)
    const yaw = -Math.PI / 2 + (h.kind === 'hushbig' ? 0.5 : h.kind === 'moth' || h.kind === 'bat' ? 1.1 : h.kind === 'colonel' ? 0.75 : 0.8);   // a moth (or a bat) turns to the camera, so both wings show
    const arm = h.kind === 'armadillo';
    const F = Object.assign(actorState('foe', x + 7, z, yaw), {
      hx: x, hz: z, spec, h, foeKind: spec.kind, species: h.kind, color: spec.color, size: h.kind === 'hushbig' ? 'big' : spec.size,
      parts: arm ? [] : h.parts.slice(), weak: h.kind === 'hushbig' ? 'tail' : h.kind === 'beetle' ? 'head' : null, weakShown: false, states: new Set(spec.states || []), alive: true, gone: false,
      tipS: [spring(-0.32), spring(-0.42), spring(-0.5)], radius: h.radius, height: h.height, floating: !!spec.floating, shy: !!spec.shy,
      sleepy: !!spec.sleepy, calmed: false, heard: new Set(), calm: 0, face: null, armUp: 0, tint: 0, down: 0,
      curl: arm ? 1 : 0, flip: 0, spin: 0, rolling: false, flipped: 0,
    });
    F.hover = h.hover || 0.95;
    if (h.kind === 'bat') F.hover = 0.75 + 0.35 * h.scale;     // (an echo bat flies higher the bigger it is: the Quarry Caves' giant one too)
    F.baseY = F.floating ? F.hover : 0;
    F.y = F.baseY;
    F.shadow = blob(shadowR(h));
    S.scene.add(h.root, F.shadow);
    return F;
  }
  // more foes in the middle of a fight (the Corn Society's squads), at the given spots
  function addFoes(specs, spots) { const out = specs.map((s, i) => makeFoe(s, spots[i][0], spots[i][1])); S.foes.push(...out); return out; }
  // the spots of a row of n
  const rowSpots = n => (SLOTS[n] || SLOTS[3]).slice(0, Math.max(1, n));
  // a foe changes into another kind where it stands (a kernel pops into popcorn): a new model on the same state
  function reskin(F, kind) {
    const old = F.h, h = _.M.build({ kind, color: F.color, size: F.size });
    S.scene.remove(old.root, F.shadow);
    F.h = h; F.species = h.kind; F.parts = h.parts.slice(); F.radius = h.radius; F.height = h.height; F.hover = h.hover || 0.95; F.tintShown = null;
    F.shadow = blob(shadowR(h));
    S.scene.add(h.root, F.shadow);
    return F;
  }
  // setup(): place the cast, build the foes. specs: [{kind, color, size, ...}]
  function setup(o) {
    const biome = ['forest', 'lake', 'cellar', 'cave', 'snow', 'marsh'].includes(o.biome) || (_.arenaBuilders && _.arenaBuilders[o.biome]) ? o.biome : 'meadow';     // (_.arenaBuilders: a region's own arena, e.g. ruins_battle.js's 'desert')
    S.arena = S.arenas[biome] || (S.arenas[biome] = buildArena(biome));
    S.scene = S.arena.scene; S.biome = biome;
    const cast = initCast(), sc = S.scene;
    cast.you.st = actorState('you', PARTY.you[0], PARTY.you[1], Math.PI / 2 - 0.42);
    cast.mimo.st = actorState('mimo', PARTY.mimo[0], PARTY.mimo[1], Math.PI / 2 - 0.42);
    cast.coach.st = actorState('coach', PARTY.coach[0], PARTY.coach[1], Math.PI / 2 - 0.7, { hidden: !o.coach });
    for (const k of ['you', 'mimo', 'coach']) { sc.add(cast[k].model.root); sc.add(cast[k].shadow); }
    cast.mimo.ears.forEach(e => { e.x = 0.12; e.v = 0; });
    // foes
    for (const f of S.foes) sc.remove(f.h.root, f.shadow);
    S.foes = [];
    const specs = o.foes || [];
    const big = specs.findIndex(s => s.kind === 'hushbig'), boss = specs.findIndex(s => s.kind === 'colonel' || s.giant);     // (a giant stands back, like the colonel)
    const row = specs.filter((s, i) => i !== boss);
    specs.forEach((spec, i) => {
      let [x, z] = (SLOTS[specs.length] || SLOTS[3])[Math.min(i, 2)];
      if (boss >= 0) [x, z] = i === boss ? BOSS_SPOT : rowSpots(row.length)[Math.min(row.indexOf(spec), 2)];
      else if (big >= 0) { if (i === big) { x = 2.6; z = -0.4; } else { x = 4.9; z = 1.0; } }
      S.foes.push(makeFoe(spec, x, z));
    });
    placePerches(sc);                          // at the lake: a lily pad or a raft under each one
    placeYard(sc, !!o.yard);                   // Bruno's training yard: a fence, an archery target, hay
    // stones (pt: pedrinha, pedra, pedrão; de: one Stein)
    for (const s of S.stones) sc.remove(s.m);
    S.stones = [];
    (o.stones || []).forEach(([kind, x, z]) => {
      const r = { light: 0.11, medium: 0.2, heavy: 0.38 }[kind];
      const m = part(new THREE.DodecahedronGeometry(1, 0), '#b9b2a6', [x, r * 0.8, z], [r * 1.15, r * 0.9, r], { ink: 0.03 / Math.max(0.6, r * 3) });
      m.rotation.set(0.3, x * 3, 0.2); sc.add(m);
      S.stones.push({ kind, m, hx: x, hz: z, r, held: false });
    });
    // TK's puffs and sparkles start at scale 1 until their first update; settle them right away
    const raw = TK.particles(sc);
    S.fx = { puff(...a) { raw.puff(...a); raw.update(0); }, sparkle(...a) { raw.sparkle(...a); raw.update(0); }, update: dt => raw.update(dt) };
    for (const e of S.extra) sc.remove(e.obj);
    S.extra = [];
    S.arena.uni.uStain.value = specs.length ? 1 : 0;
    const c = S.foes.length ? S.foes.reduce((a, f) => a.add(new THREE.Vector2(f.hx, f.hz)), new THREE.Vector2()).multiplyScalar(1 / S.foes.length) : new THREE.Vector2(3, 0);
    S.arena.uni.uStainC.value.copy(c);
    S.cam.cur = Object.assign({}, SHOTS.intro());
    S.cam.goal = Object.assign({}, SHOTS.wide());
    return { cast, foes: S.foes };
  }
  function teardown() {
    if (!S.scene) return;
    if (S.fx) S.fx.update(10);   // let any puffs and sparkles still in the air finish, so none stay behind in the (reused) arena
    for (const f of S.foes) S.scene.remove(f.h.root, f.shadow);
    for (const s of S.stones) S.scene.remove(s.m);
    for (const e of S.extra) S.scene.remove(e.obj);
    for (const p of S.perches) S.scene.remove(p.obj);
    for (const p of S.props) S.scene.remove(p);
    S.foes = []; S.stones = []; S.extra = []; S.perches = []; S.props = [];
    if (S.arena && S.arena.uni.uHeat) S.arena.uni.uHeat.value = 0;
  }

  // ------------------------------------------------------------ camera: a three-quarter view that glides between shots
  const SHOTS = {
    wide: () => ({ cx: 0.45, cy: 0.35, cz: 0.3, dist: 11.6, yaw: -0.1, pitch: 0.34, fov: 36 }),
    intro: () => ({ cx: 1.5, cy: 1.2, cz: -1, dist: 21, yaw: -0.75, pitch: 0.62, fov: 38 }),
    party: () => ({ cx: -2.8, cy: 0.7, cz: 0.5, dist: 7.2, yaw: -0.1, pitch: 0.2, fov: 36 }),
    coach: () => ({ cx: -3.7, cy: 0.85, cz: 0.45, dist: 8.4, yaw: -0.05, pitch: 0.19, fov: 36 }),
    win: () => ({ cx: -1.2, cy: 0.75, cz: 0.6, dist: 7.4, yaw: -0.12, pitch: 0.17, fov: 34 }),
    flee: () => ({ cx: -6, cy: 0.8, cz: 0.8, dist: 10, yaw: -0.4, pitch: 0.22, fov: 36 }),
  };
  S.cam = { cur: SHOTS.wide(), goal: SHOTS.wide(), k: 3.2, shake: 0, kick: 0, sx: 0, sy: 0 };
  function shot(name, a, b, o = {}) {
    let g;
    if (SHOTS[name]) g = SHOTS[name]();
    else if (name === 'focus' || name === 'action') {
      // frame two points (actor states or {x,z}) with a little room
      const ax = a.x, az = a.z, bx = b ? b.x : a.x, bz = b ? b.z : a.z;
      const span = Math.hypot(ax - bx, az - bz);
      g = { cx: (ax + bx) / 2, cy: 0.7 + (o.up || 0), cz: (az + bz) / 2 + 0.2, dist: clamp(5.8 + span * 0.85, 6, 11.5), yaw: o.yaw !== undefined ? o.yaw : -0.16, pitch: o.pitch || 0.22, fov: 36 };
    } else g = SHOTS.wide();
    if (o.dist) g.dist = o.dist;
    S.cam.goal = g; S.cam.k = o.k || 3.2;
  }
  function updateCamera(dt) {
    const c = S.cam, cur = c.cur, g = c.goal;
    for (const k in g) cur[k] = damp(cur[k], g[k], k === 'fov' ? 5 : c.k, dt);
    c.shake = Math.max(0, c.shake - dt * 3.2);
    c.kick = Math.max(0, c.kick - dt * 5);
    const cp = Math.cos(cur.pitch);
    const pos = new THREE.Vector3(cur.cx + Math.sin(cur.yaw) * cur.dist * cp, cur.cy + Math.sin(cur.pitch) * cur.dist, cur.cz + Math.cos(cur.yaw) * cur.dist * cp);
    const sh = c.shake * c.shake * 0.35, t = S.t;
    const ox = (Math.sin(t * 61.3) + Math.sin(t * 37.1) * 0.6) * sh, oy = (Math.sin(t * 53.7 + 1) + Math.sin(t * 29.3) * 0.6) * sh;
    S.camera.position.set(pos.x + ox, pos.y + oy, pos.z);
    S.camera.lookAt(cur.cx + ox * 0.6, cur.cy + oy * 0.6, cur.cz);
    S.camera.fov = cur.fov - c.kick * 3;
    S.camera.updateProjectionMatrix();
  }
  const shake = (amt, kick = 0) => { S.cam.shake = Math.min(1.6, S.cam.shake + amt); S.cam.kick = Math.min(1, S.cam.kick + kick); };

  // ------------------------------------------------------------ posing (every frame)
  function moodTick(st, t) { if (st.moodUntil && t > st.moodUntil) { st.mood = st.baseMood || 'idle'; st.moodUntil = 0; } }
  function velocity(st, dt) { const vy = dt > 0 ? (st.y - st.py) / dt : 0; st.vy = damp(st.vy, vy, 18, dt); st.py = st.y; }
  function placeShadow(sh, st, r) {
    sh.position.set(st.x, 0.02, st.z);
    const air = Math.max(0, st.y - (st.baseY || 0));
    sh.scale.setScalar(clamp(1 - air * 0.18, 0.35, 1));
    sh.material.opacity = 0.24 * clamp(1 - air * 0.15, 0.3, 1);
    sh.visible = !st.hidden;
  }
  function flashMeshes(root, on) {
    root.traverse(o => {
      if (!o.isMesh) return;
      if (on) {
        if (o.material === FLASH || o.material.side === THREE.BackSide || o.userData.noFlash) return;   // ink hulls stay ink
        o.userData.mat0 = o.material; o.material = FLASH;
      } else if (o.userData.mat0) { o.material = o.userData.mat0; o.userData.mat0 = null; }
    });
  }
  const FLASH = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  function applyFlash(root, st, t) {
    const on = st.flash > 0 && Math.floor(t * 30) % 2 === 0;
    if (on !== !!st.flashOn) { flashMeshes(root, on); st.flashOn = on; }
  }
  function poseYou(c, t, dt) {
    const h = c.model, Y = c.st;
    moodTick(Y, t); velocity(Y, dt);
    h.root.visible = !Y.hidden;
    h.root.position.set(Y.x, Y.y, Y.z); h.root.rotation.y = Y.yaw;
    const br = 1 + Math.sin(t * 2.2 + Y.seed) * 0.014;
    h.body.scale.set(Y.sx / Math.sqrt(br), Y.sy * br, Y.sx / Math.sqrt(br));
    h.body.rotation.x = Y.lean; h.body.rotation.z = Y.tilt;
    const air = Y.y > 0.05;
    h.legs[0].rotation.x = air ? -0.7 : Y.run ? Math.sin(t * 16) * 0.8 : 0; h.legs[1].rotation.x = air ? 0.35 : Y.run ? -Math.sin(t * 16) * 0.8 : 0;
    const cheer = Y.cheer, pt = Y.point;
    h.arms[0].rotation.x = -1.45 * pt - 0.4 * cheer + (Y.run ? Math.sin(t * 16) * 0.7 : 0);
    h.arms[0].rotation.z = -0.12 - 2.4 * cheer - 0.15 * pt;
    h.arms[1].rotation.x = -0.4 * cheer + (Y.run ? -Math.sin(t * 16) * 0.7 : 0);
    h.arms[1].rotation.z = 0.12 + 2.4 * cheer;
    h.head.rotation.y = damp(h.head.rotation.y, Y.look, 6, dt);
    h.head.rotation.x = Y.talk > 0 ? Math.sin(t * 14) * 0.05 : Y.mood === 'hurt' ? -0.25 : 0;
    h.head.rotation.z = damp(h.head.rotation.z, Y.mood === 'think' ? 0.14 + Math.sin(t * 1.3) * 0.04 : 0, 5, dt);
    const blink = (t + Y.seed) % 3.9 < 0.12 || Y.mood === 'hurt';
    h.eyes.forEach(e => { e.scale.y = blink ? 0.12 : Y.mood === 'happy' ? 0.55 : 1; });
    h.tail.forEach((s, i) => { s.rotation.x = 0.25 + clamp(-Y.vy * 0.08, -0.3, 0.6) * (i + 1) * 0.4 + Math.sin(t * 5 + i * 0.9) * 0.06; s.rotation.z = Math.sin(t * 3.5 + i) * 0.08; });
    applyFlash(h.root, Y, t);
    placeShadow(c.shadow, Y);
  }
  const EAR = { idle: [0.12, 0.1], perk: [-0.08, -0.25], listen: [-0.04, -0.2], go: [0.22, 0.95], happy: [0.15, -0.1], sad: [1.05, 0.55], hurt: [0.85, 0.4], confused: [0.12, 0.1], think: [0.3, 0.1], duck: [0.9, 1.1] };
  function poseMimo(c, t, dt) {
    const m = c.model, M = c.st;
    moodTick(M, t); velocity(M, dt);
    m.root.visible = !M.hidden;
    m.root.position.set(M.x, M.y, M.z); m.root.rotation.y = M.yaw;
    const br = 1 + Math.sin(t * 3 + M.seed) * 0.02;
    m.body.scale.set(M.sx / Math.sqrt(br), M.sy * br, M.sx / Math.sqrt(br));
    m.body.rotation.z = M.tilt + (M.mood === 'confused' ? 0.22 : 0) + (M.mood === 'listen' ? Math.sin(t * 2) * 0.05 + 0.08 : 0);
    m.body.rotation.x = M.lean;
    // ears: springs toward the mood's pose, kicked by vertical motion and flapping when happy
    const want = EAR[M.mood] || EAR.idle;
    c.ears.forEach((e, i) => {
      let a = want[0] + Math.sin(t * 1.7 + i * 2 + M.seed) * 0.04;
      if (M.mood === 'happy') a += Math.sin(t * 13 + i * 1.3) * 0.32;
      if (M.mood === 'confused') a += i ? 0.75 : -0.12;
      a += clamp(M.vy * 0.07, -0.5, 0.6);
      stepSpring(e, a, 90, 8, dt);
      if (e.x > 1.15) { e.x = 1.15; if (e.v > 0) e.v *= -0.25; } else if (e.x < -0.35) { e.x = -0.35; if (e.v < 0) e.v *= -0.25; }    // (never down the body's sides, where they vanish)
      let back = want[1] + clamp(M.vy * 0.05, -0.4, 0.4) + (M.earWhip || 0);
      stepSpring(c.earBack[i], back, 110, 9, dt);
      if (c.earBack[i].x > 1.25) { c.earBack[i].x = 1.25; if (c.earBack[i].v > 0) c.earBack[i].v = 0; }
      m.ears[i].rotation.z = (i ? -1 : 1) * e.x;
      m.ears[i].rotation.x = -c.earBack[i].x;
    });
    const blink = (t * 1.1 + M.seed) % 3.3 < 0.11;
    m.eyes.forEach((e, i) => {
      let sy = blink ? 0.12 : M.mood === 'happy' ? 0.45 : M.mood === 'hurt' || M.mood === 'duck' ? 0.18 : M.mood === 'go' ? 0.85 : 1;
      if (M.mood === 'confused') sy = i ? 0.7 : 1.12;
      e.scale.y = damp(e.scale.y, sy, 30, dt);
    });
    m.mouth.scale.y = M.talk > 0 ? 0.012 + Math.abs(Math.sin(t * 18)) * 0.03 : M.mood === 'happy' || M.mood === 'go' ? 0.026 : 0.012;
    m.gem.rotation.y = t * 1.5 + M.glow * t * 6;
    m.glow.material.opacity = 0.25 + M.glow * 0.75 + Math.sin(t * 3) * 0.08;
    m.glow.scale.setScalar(0.6 + M.glow * 0.6);
    applyFlash(m.root, M, t);
    placeShadow(c.shadow, M);
  }
  function poseCoach(c, t, dt) {
    const v = c.model, C = c.st;
    moodTick(C, t); velocity(C, dt);
    v.root.visible = !C.hidden; c.shadow.visible = !C.hidden;
    v.root.position.set(C.x, C.y, C.z); v.root.rotation.y = C.yaw;
    v.body.scale.set(C.sx, C.sy, C.sx);
    v.body.rotation.z = Math.sin(t * 1.2 + C.seed) * 0.025 + C.tilt; v.body.rotation.x = C.lean;
    v.body.position.y = C.talk > 0 ? Math.abs(Math.sin(t * 13)) * 0.035 : 0;
    v.mouth.scale.y = C.talk > 0 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : 0.012;
    v.arms[1].rotation.set(-0.5 - 1.1 * C.point - 0.9 * (C.punch || 0), 0, -0.2 - 0.3 * C.point + (C.wave ? -2.2 + Math.sin(t * 9) * 0.35 : 0));
    v.arms[0].rotation.set(-0.5 - 0.6 * (C.cheer || 0), 0, 0.2 + 1.8 * (C.cheer || 0));
    if (v.head) v.head.rotation.y = damp(v.head.rotation.y, C.look, 5, dt);
    placeShadow(c.shadow, C);
  }
  function poseFoe(F, t, dt) {
    moodTick(F, t);
    const vy = dt > 0 ? (F.y - F.py) / dt : 0; F.vy = damp(F.vy, vy, 18, dt); F.py = F.y;
    const h = F.h;
    h.root.visible = !F.hidden;
    const bob = F.floating && F.alive ? Math.sin(t * 2.4 + F.seed) * 0.12 : 0;
    h.root.position.set(F.x, F.y + bob, F.z);
    h.root.rotation.y = F.yaw;
    _.M.pose(h, F, t, dt);
    if (F.tint !== F.tintShown) { _.M.brighten(h, F.tint); F.tintShown = F.tint; }
    applyFlash(h.root, F, t);
    placeShadow(F.shadow, F);
    F.shadow.visible = !F.hidden;
    if (F.states.has('asleep') && F.alive && !F.hidden && Math.random() < dt * 0.9) zzz(worldOf(F, 'top'));
  }

  // ------------------------------------------------------------ effects: impact stars, rings, z's, notes
  const starTex = TK.canvasTex(128, 128, c => {
    c.translate(64, 64); c.beginPath();
    for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8 - Math.PI / 2, r = i % 2 ? 26 : 58; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#ffffff'; c.fill();
  });
  function addFx(obj, life, fn) { fn(obj, 1, 0); S.scene.add(obj); S.extra.push({ obj, life, max: life, fn }); return obj; }
  function star(pos, color = '#ffffff', size = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color, transparent: true, depthTest: false, depthWrite: false }));
    s.position.copy(pos); s.renderOrder = 10; s.material.rotation = Math.random() * TAU;
    addFx(s, 0.3, (o, k) => { const u = 1 - k; o.scale.setScalar(size * (u < 0.3 ? u / 0.3 * 1.25 : 1.25 - (u - 0.3) * 0.5)); o.material.opacity = k < 0.5 ? k * 2 : 1; });
  }
  function ring(pos, color = '#ffffff', size = 2) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 40), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.set(pos.x, 0.05, pos.z);
    addFx(m, 0.45, (o, k) => { const u = 1 - k; o.scale.setScalar(0.3 + u * size); o.material.opacity = k * 0.8; });
  }
  function zzz(pos) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _.M.zTex, transparent: true, depthWrite: false }));
    s.position.copy(pos); const ph = Math.random() * TAU;
    addFx(s, 2, (o, k, dt) => { const u = 1 - k; o.position.y += dt * 0.45; o.position.x += Math.sin(u * 6 + ph) * dt * 0.3 - dt * 0.15; o.scale.setScalar(0.18 + u * 0.25); o.material.opacity = Math.min(1, k * 2.5) * Math.min(1, u * 5); });
  }
  function note(pos) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: _.M.noteTex, transparent: true, depthWrite: false }));
    s.position.copy(pos); const ph = Math.random() * TAU;
    addFx(s, 2.4, (o, k, dt) => { const u = 1 - k; o.position.y += dt * 0.9; o.position.x += Math.sin(u * 7 + ph) * dt * 0.5; o.scale.setScalar(0.35 + Math.sin(u * 20) * 0.03); o.material.opacity = Math.min(1, k * 3); });
  }
  // the lake: is (x, z) on the dock or on something floating (else it's open water)
  const onBoards = (x, z) => (x < DOCK_END && z > DOCK_Z0 - 0.1 && z < DOCK_Z1 + 0.1) || S.perches.some(p => Math.hypot(p.x - x, p.z - z) < p.r);
  // a splash where something goes into the water (at the lake; anywhere else, or on the boards, a puff of dust)
  function splash(x, z, size = 1) {
    if (!S.scene || !S.fx) return;
    if (S.biome !== 'lake' || onBoards(x, z)) { S.fx.puff(x, 0.02, z, Math.round(3 + 3 * size), 0.1 + 0.08 * size, S.biome === 'lake' ? '#e9f6f3' : '#ffffff'); return; }
    S.fx.puff(x, WATER_Y, z, Math.round(5 + 6 * size), 0.15 + 0.1 * size, '#dcf2f6', 1.5);
    ring({ x, z }, '#eefaf8', 1.2 + size * 1.3);
    for (let i = 0; i < 6 + 8 * size; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#e2f5fb', transparent: true, depthWrite: false }));
      const a = Math.random() * TAU, out = (0.6 + Math.random()) * size, v = new THREE.Vector3(Math.cos(a) * out, (2.4 + Math.random() * 1.8) * Math.sqrt(size), Math.sin(a) * out);
      s.position.set(x, WATER_Y + 0.05, z); s.scale.setScalar(0.11 + Math.random() * 0.1);
      addFx(s, 0.75, (o, k, dt) => { if (!dt) return; v.y -= 9.5 * dt; o.position.addScaledVector(v, dt); o.material.opacity = Math.min(1, k * 3); if (o.position.y < WATER_Y) o.material.opacity = 0; });
    }
  }
  // a piece of popcorn, as a little sprite: white puffs with an ink edge and a scrap of yellow hull
  const popTex = TK.canvasTex(64, 64, c => {
    c.lineWidth = 5; c.strokeStyle = INK; c.fillStyle = '#fff8e6';
    [[24, 30, 14], [40, 26, 13], [34, 42, 14], [22, 44, 10]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); });
    [[24, 30, 14], [40, 26, 13], [34, 42, 14], [22, 44, 10]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r - 1, 0, TAU); c.fill(); });
    c.fillStyle = '#f2c94c'; c.beginPath(); c.ellipse(36, 50, 7, 4, 0.4, 0, TAU); c.fill();
  });
  // popcorn bursting out of a kernel as it pops (and steam)
  function popBurst(pos, n = 9) {
    if (!S.scene || !S.fx) return;
    S.fx.puff(pos.x, pos.y, pos.z, 6, 0.2, '#f6efe4', 1.6);
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: popTex, transparent: true, depthWrite: false }));
      const a = Math.random() * TAU, out = 0.8 + Math.random() * 1.4, v = new THREE.Vector3(Math.cos(a) * out, 2.6 + Math.random() * 2.2, Math.sin(a) * out);
      s.position.copy(pos); s.scale.setScalar(0.22 + Math.random() * 0.1); s.material.rotation = Math.random() * TAU;
      addFx(s, 0.9, (o, k, dt) => { if (!dt) return; v.y -= 9.5 * dt; o.position.addScaledVector(v, dt); o.material.rotation += dt * 6; o.material.opacity = Math.min(1, k * 3); if (o.position.y < 0.05) { o.position.y = 0.05; v.y = Math.abs(v.y) * 0.35; v.x *= 0.6; v.z *= 0.6; } });
    }
  }
  // water (or popcorn, o.popcorn) flying from one point to another over dur seconds: high, in an arc that comes down at
  // head height; low, skimming along the ground (a frog's splash, the colonel's popcorn burst: it reaches `to` at the end)
  function spray(from, to, dur, high, o = {}) {
    if (!S.scene) return;
    for (let i = 0; i < 14; i++) {
      const s = new THREE.Sprite(o.popcorn ? new THREE.SpriteMaterial({ map: popTex, transparent: true, depthWrite: false, rotation: Math.random() * TAU })
        : new THREE.SpriteMaterial({ map: glowTex, color: i % 3 ? '#dff4fa' : '#ffffff', transparent: true, depthWrite: false }));
      const jx = (Math.random() - 0.5) * 0.45, jy = (Math.random() - 0.5) * 0.25, jz = (Math.random() - 0.5) * 0.7, lag = i * 0.012, sz = (0.13 + Math.random() * 0.15) * (o.popcorn ? 1.5 : 1);
      s.scale.setScalar(sz); s.position.copy(from);
      addFx(s, dur + 0.25, (o, k) => {
        const u = clamp(((1 - k) * (dur + 0.25)) / dur * 1.12 - lag, 0, 1.3), w = Math.min(1, u);
        o.position.set(lerp(from.x, to.x, w) + jx * (1 - w * 0.6), lerp(from.y, to.y, w) + (high ? 4 * 1.25 * w * (1 - w) : Math.abs(Math.sin(w * Math.PI * 3)) * 0.08) + jy, lerp(from.z, to.z, w) + jz * (high ? 0.6 : 1));
        if (u > 1) o.position.x -= (u - 1) * 1.5;
        o.material.opacity = u <= 0 ? 0 : u > 1 ? Math.max(0, 1 - (u - 1) * 3.5) : 1;
      });
    }
  }
  // a pad or raft dips under whoever lands on it
  function perchDip(x, z, amt = 0.045) { const p = S.perches.find(q => Math.hypot(q.x - x, q.z - z) < q.r + 0.2); if (p) p.dip = amt; }
  function updateFx(dt) {
    for (let i = S.extra.length - 1; i >= 0; i--) {
      const e = S.extra[i]; e.life -= dt;
      if (e.life <= 0) { S.scene.remove(e.obj); if (e.obj.material) e.obj.material.dispose(); S.extra.splice(i, 1); continue; }
      e.fn(e.obj, e.life / e.max, dt);
    }
  }
  // a prop flow.js moves itself (the food Mimo eats); it's cleared with the stage if the fight ends first
  function prop(obj) { S.scene.add(obj); S.extra.push({ obj, life: 1e9, max: 1e9, fn: () => {} }); return obj; }
  function dropProp(obj) { const i = S.extra.findIndex(e => e.obj === obj); if (i >= 0) S.extra.splice(i, 1); if (S.scene) S.scene.remove(obj); }

  // ------------------------------------------------------------ positions
  const v3 = new THREE.Vector3();
  // world position of a spot on an actor: 'top' (above the head), 'mid', 'feet', or a foe part
  function worldOf(st, spot = 'top') {
    if (st.h) {
      const a = st.h.anchors[spot] || st.h.anchors.top;
      st.h.root.updateMatrixWorld(true);
      return a.getWorldPosition(new THREE.Vector3());
    }
    const H = { you: 1.72, mimo: 0.95, coach: 2.0 }[st.kind] || 1;
    const k = spot === 'mid' ? 0.5 : spot === 'feet' ? 0 : spot === 'ears' ? 1.3 : 1;
    return new THREE.Vector3(st.x, st.y + H * k, st.z);
  }
  function project(p) {
    v3.copy(p).project(S.camera);
    const r = S.rect;
    return { x: r.left + (v3.x * 0.5 + 0.5) * r.width, y: r.top + (-v3.y * 0.5 + 0.5) * r.height, on: v3.z < 1 };
  }

  // ------------------------------------------------------------ per frame
  function update(dt, t) {
    S.t = t;
    if (!S.scene || !S.cast) return;
    const cast = S.cast;
    poseYou(cast.you, t, dt);
    poseMimo(cast.mimo, t, dt);
    poseCoach(cast.coach, t, dt);
    for (const F of S.foes) poseFoe(F, t, dt);
    for (const s of S.stones) if (!s.held) { s.m.position.set(s.hx, s.r * 0.8, s.hz); }
    for (const p of S.perches) {               // the lake's pads and rafts bob, and dip when someone lands
      p.dip = damp(p.dip, 0, 5, dt);
      p.obj.position.y = Math.sin(t * 1.3 + p.ph) * 0.01 - p.dip;
      p.obj.rotation.x = Math.sin(t * 0.9 + p.ph) * 0.015; p.obj.rotation.z = Math.sin(t * 0.7 + p.ph * 2) * 0.015;
    }
    S.arena.update(t, dt, S.arena.uni.uStainC.value);
    S.fx.update(dt);
    updateFx(dt);
  }
  // the camera runs on real time, so it keeps shaking through hit-stop
  function cameraStep(dt, renderer) {
    if (renderer) {
      const r = renderer.domElement.getBoundingClientRect();
      if (r.width && r.height) { S.rect = r; S.camera.aspect = r.width / r.height; }
    }
    updateCamera(dt);
  }
  function render(renderer) {
    if (!S.scene) return;
    renderer.render(S.scene, S.camera);
  }

  _.STAGE = { S, setup, teardown, update, cameraStep, render, shot, shake, worldOf, project, star, ring, zzz, note, prop, dropProp, groundH, SHOTS, PARTY,
    splash, spray, perchDip, DOCK_END, WATER_Y, addFoes, reskin, rowSpots, popBurst, BOSS_SPOT };
})();
