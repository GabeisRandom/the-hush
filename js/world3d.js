'use strict';
// Draws the map from world.js in the toon style: terrain, wind-blown grass that parts around you,
// the stream and pond, the forest (instanced trees that sway), the station and its train, the
// village of Alba, and the Hush (grayed-out patches with drifting motes).

function buildWorld3D(renderer) {
  const { L } = WORLD, { toon, part, G, merge, M4, fl } = TK;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 900);
  const FOG = new THREE.Color('#c3e4ef');
  scene.fog = new THREE.Fog(FOG.clone(), 45, 240);
  const SUN = new THREE.Vector3(0.45, 0.82, 0.35).normalize();
  const fx = TK.particles(scene);
  const time = { value: 0 };

  // ------------------------------------------------------------ the map texture: height, grass, hush, path
  const mapTex = new THREE.DataTexture(WORLD.MAP, WORLD.GW, WORLD.GH, THREE.RGBAFormat, THREE.FloatType);
  const linear = !!renderer.extensions.get('OES_texture_float_linear');
  mapTex.minFilter = mapTex.magFilter = linear ? THREE.LinearFilter : THREE.NearestFilter;
  mapTex.needsUpdate = true;
  const MAPGLSL = `
    uniform sampler2D uMap;
    vec4 mapAt(vec2 p) { return texture2D(uMap, (p - vec2(${fl(L.minX)}, ${fl(L.minZ)}) + 0.5) / vec2(${fl(WORLD.GW)}, ${fl(WORLD.GH)})); }`;
  // (TIME.land, time_land.js: in the dressed region the blades take its colors and height. uLand: its middle, radius and how much;
  // inside uLandHeal (middle, radius, on) they're today's again. All zero: today everywhere. Both grass patches share these.)
  const LANDU = { uLand: { value: new THREE.Vector4() }, uLandTip: { value: new THREE.Color(1, 1, 1) }, uLandBase: { value: new THREE.Color(1, 1, 1) }, uLandH: { value: 1 }, uLandHeal: { value: new THREE.Vector4() } };
  const LANDGLSL = `
    uniform vec4 uLand; uniform vec3 uLandTip; uniform vec3 uLandBase; uniform float uLandH; uniform vec4 uLandHeal;
    float landK(vec2 p) { float k = uLand.w * (1.0 - smoothstep(uLand.z * 0.82, uLand.z, length(p - uLand.xy))); return k * (1.0 - uLandHeal.w * (1.0 - smoothstep(uLandHeal.z * 0.62, uLandHeal.z, length(p - uLandHeal.xy)))); }`;

  // ------------------------------------------------------------ light and sky
  const hemi = new THREE.HemisphereLight('#d7ecff', '#5d7040', 0.5);
  const sun = new THREE.DirectionalLight('#fff0d2', 0.68);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
  scene.add(hemi, sun, sun.target);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sunDir: { value: SUN }, uHush: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 sunDir; uniform float uHush; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y, 0.0, 1.0);
        vec3 col = mix(vec3(0.80, 0.91, 0.95), vec3(0.24, 0.55, 0.88), pow(h, 0.55));
        float s = max(dot(vDir, sunDir), 0.0);
        col += vec3(1.0, 0.92, 0.7) * (pow(s, 12.0) * 0.35 + smoothstep(0.9975, 0.999, s) * 0.9);
        col = mix(col, vec3(dot(col, vec3(0.33))), uHush * 0.5);
        gl_FragColor = vec4(col, 1.0); }`,
  }));
  sky.renderOrder = -1; scene.add(sky);

  // ------------------------------------------------------------ terrain
  const terrain = (() => {
    const geo = new THREE.PlaneGeometry(WORLD.GW - 1, WORLD.GH - 1, WORLD.GW - 1, WORLD.GH - 1);
    geo.rotateX(-Math.PI / 2);
    geo.translate(L.minX + (WORLD.GW - 1) / 2, 0, L.minZ + (WORLD.GH - 1) / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
    const MEADOW = new THREE.Color('#4f9440'), MEADOW2 = new THREE.Color('#66a447'), FOREST = new THREE.Color('#3c7232'), MOSS = new THREE.Color('#4f7d36'),
      PATH = new THREE.Color('#c9ad78'), SAND = new THREE.Color('#d6c48f'), BED = new THREE.Color('#9c8c62'), ROCK = new THREE.Color('#8f8d80'), GRAY = new THREE.Color('#8b8c86'), SLOPE = new THREE.Color('#3f7a37');
    function tint(i) {
      const x = p.getX(i), z = p.getZ(i), h = p.getY(i);
      const sl = Math.hypot(WORLD.terrainAt(x + 0.5, z) - WORLD.terrainAt(x - 0.5, z), WORLD.terrainAt(x, z + 0.5) - WORLD.terrainAt(x, z - 0.5));
      c.copy(MEADOW).lerp(MEADOW2, 0.5 + 0.5 * Math.sin(x * 0.13 + Math.cos(z * 0.11) * 2));
      c.lerp(FOREST, WORLD.forestAt(x, z));
      c.lerp(MOSS, WORLD.forestAt(x, z) * (0.5 + 0.5 * Math.sin(x * 0.4 + z * 0.33)) * 0.5);
      c.lerp(PATH, WORLD.mapAt(x, z, 3));
      if (h < L.water + 0.5) { c.lerp(SAND, smoothstep(L.water + 0.5, L.water + 0.05, h)); c.lerp(BED, smoothstep(L.water, L.water - 0.6, h)); }
      c.lerp(SLOPE, smoothstep(0.45, 0.9, sl) * 0.7);
      c.lerp(ROCK, smoothstep(1.1, 1.5, sl));
      if (typeof PEAKS !== 'undefined' && x > 100 && z < -190) PEAKS.tint(x, z, c, sl, h);     // (the Frost Peaks: snow, packed down where you walk)
      if (typeof MARSH !== 'undefined' && z < -268) MARSH.tint(x, z, c, sl, h);     // (the Gray Marsh: peat, moss and the causeway's stones; the ridge's rock)
      if (typeof RUINS !== 'undefined' && x > 74 && z > -51) RUINS.tint(x, z, c, sl, h);     // (the Sunken Ruins: sand on the floor, red rock in bands up the walls)
      c.lerp(GRAY, WORLD.mapAt(x, z, 2) * 0.75);
      col.set([c.r, c.g, c.b], i * 3);
    }
    for (let i = 0; i < p.count; i++) { p.setY(i, WORLD.terrainAt(p.getX(i), p.getZ(i))); }
    for (let i = 0; i < p.count; i++) tint(i);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, toon('#ffffff', { vc: 1, rim: 0 }));
    m.receiveShadow = true;
    // repaint a round patch (used when the Hush lifts)
    m.userData.recolor = (cx, cz, r) => {
      for (let j = Math.max(0, Math.floor(cz - r - L.minZ)); j <= Math.min(WORLD.GH - 1, Math.ceil(cz + r - L.minZ)); j++)
        for (let i = Math.max(0, Math.floor(cx - r - L.minX)); i <= Math.min(WORLD.GW - 1, Math.ceil(cx + r - L.minX)); i++) tint(j * WORLD.GW + i);
      geo.attributes.color.needsUpdate = true;
    };
    return m;
  })();
  scene.add(terrain);
  // The Hush lifting from a patch: the gray drains out over a couple of seconds. Several can lift at once (one region's bell
  // and the next region's gate open on the same flag: a single slot let the second stop the first halfway, gray for good)
  const lifting = new Set();
  function liftOne(idx, dt) {
    const h = L.hush[idx]; if (!h) { lifting.delete(idx); return; }
    h.a = Math.max(0, h.a - dt * 0.45);
    for (let j = Math.max(0, Math.floor(h.z - h.r - L.minZ)); j <= Math.min(WORLD.GH - 1, Math.ceil(h.z + h.r - L.minZ)); j++)
      for (let i = Math.max(0, Math.floor(h.x - h.r - L.minX)); i <= Math.min(WORLD.GW - 1, Math.ceil(h.x + h.r - L.minX)); i++)
        WORLD.MAP[(j * WORLD.GW + i) * 4 + 2] = WORLD.hushAt(L.minX + i, L.minZ + j);
    mapTex.needsUpdate = true;
    terrain.userData.recolor(h.x, h.z, h.r);
    if (h.a <= 0) lifting.delete(idx);
  }
  function liftStep(dt) { for (const idx of [...lifting]) liftOne(idx, dt); }

  // ------------------------------------------------------------ grass: blades in a patch that follows the camera
  const PATCH = 46, BLADES = 56000;
  const grass = (() => {
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.33, 0.5, 0, 0.33, 0.5, 0, 0, 1, 0]), 3));
    geo.setIndex([0, 1, 2, 2, 1, 3, 2, 3, 4]);
    const off = new Float32Array(BLADES * 2), rnd = new Float32Array(BLADES * 4), R = rng(99);
    for (let i = 0; i < BLADES; i++) { off[i * 2] = R() * PATCH; off[i * 2 + 1] = R() * PATCH; rnd.set([R(), 0.35 + R() * 0.65, R(), R()], i * 4); }
    geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2));
    geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
    geo.instanceCount = BLADES;
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: Object.assign({ uMap: { value: mapTex }, uTime: time, uCenter: { value: new THREE.Vector2() }, uPlayer: { value: new THREE.Vector3() }, uMimo: { value: new THREE.Vector3() },
        uFog: { value: scene.fog.color }, uFogNear: { value: 45 }, uFogFar: { value: 240 }, uTint: { value: new THREE.Color(1, 1, 1) } }, LANDU),     // (uTint: a realm's light on the unlit blades, past.js; white = as they are)
      vertexShader: `${MAPGLSL}${LANDGLSL}
        uniform float uTime; uniform vec2 uCenter; uniform vec3 uPlayer; uniform vec3 uMimo;
        attribute vec2 aOff; attribute vec4 aRnd;
        varying float vY; varying float vFogD; varying vec3 vCol;
        void main() {
          vec2 wp = aOff + ${fl(PATCH)} * floor((uCenter - aOff) / ${fl(PATCH)} + 0.5);
          vec4 m = mapAt(wp);
          float lk = landK(wp);
          float fade = 1.0 - smoothstep(${fl(PATCH * 0.3)}, ${fl(PATCH * 0.49)}, length(wp - uCenter));
          float amt = m.g;
          float keep = step(1.0 - amt, aRnd.y * 0.999);          // sparse where there's less grass
          float town = 1.0 - smoothstep(-5.0, -1.0, min(length(wp - vec2(${fl(L.town.x)}, ${fl(L.town.z)})) - ${fl(L.town.r)},
                                                         length(wp - vec2(${fl(L.molinar.x)}, ${fl(L.molinar.z)})) - ${fl(L.molinar.r)}));   // lawns in the towns are kept short
          float bh = (0.3 + 0.52 * aRnd.y) * fade * keep * (0.55 + 0.45 * amt) * (1.0 - 0.6 * town);
          bh *= mix(1.0, uLandH, lk);
          float bw = 0.075 + 0.05 * aRnd.z;
          float ang = aRnd.x * 6.2831;
          vec3 p = vec3(cos(ang) * position.x * bw, position.y * bh, sin(ang) * position.x * bw);
          float bend = position.y * position.y;
          float calm = 1.0 - m.b * 0.85;                           // the Hush stills the wind
          float wv = sin(uTime * 1.7 + wp.x * 0.33 + wp.y * 0.21) * 0.55 + sin(uTime * 3.3 + wp.x * 1.1 + wp.y * 0.7) * 0.15 + 0.45;
          p.xz += vec2(0.85, 0.4) * wv * 0.42 * bend * bh * calm;
          vec2 aw = wp - uPlayer.xz; float pd = length(aw);
          float push = (1.0 - smoothstep(0.15, 1.15, pd)) * step(uPlayer.y - m.r, 1.0);
          vec2 aw2 = wp - uMimo.xz; float md = length(aw2);
          float push2 = (1.0 - smoothstep(0.1, 0.7, md)) * step(uMimo.y - m.r, 0.6);
          p.xz += (normalize(aw + 1e-4) * push + normalize(aw2 + 1e-4) * push2 * 0.7) * 0.6 * bend * bh;
          p.y -= (push + push2 * 0.6) * 0.3 * bend * bh;
          vec4 mv = modelViewMatrix * vec4(vec3(wp.x, m.r - 0.03, wp.y) + p, 1.0);
          gl_Position = projectionMatrix * mv;
          vY = position.y; vFogD = -mv.z;
          float dry = smoothstep(0.35, 1.0, sin(wp.x * 0.045 + 1.0) * sin(wp.y * 0.06 - 0.5) + 0.35);
          vec3 base = vec3(0.24, 0.5, 0.2), tip = mix(vec3(0.62, 0.84, 0.36), vec3(0.86, 0.85, 0.47), dry);
          vec3 c = mix(base, tip, position.y) * (0.86 + 0.28 * aRnd.w);
          c = mix(c, mix(uLandBase, uLandTip, position.y) * (0.86 + 0.28 * aRnd.w), lk);
          c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(0.95, 0.95, 1.0), m.b * 0.8);
          vCol = c;
        }`,
      fragmentShader: `uniform vec3 uFog; uniform float uFogNear, uFogFar; uniform vec3 uTint;
        varying float vY; varying float vFogD; varying vec3 vCol;
        void main() { vec3 col = vCol * (0.78 + 0.22 * vY) * uTint; gl_FragColor = vec4(mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD)), 1.0); }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; return mesh;
  })();
  scene.add(grass);
  // The far grass (P7b, playtest 7: "its very obvious your only loading a little circle of it"). A second patch, also one draw
  // call: 120 m wide, 56,000 wider blades, centered 30 m ahead of the camera (the near one: 12 m). Its blades come in, a few more
  // at a time, where the near patch thins out (its fade, turned round: uInner is the near patch's center); past 26 m from the
  // camera fewer of them are kept (26/d, at least a third: far off they're specks); and toward its own edge they get fewer,
  // shorter and the color of the meadow under them (the terrain's MEADOW / MEADOW2 as the sun lights them), so the field runs on
  // about 85 m ahead with no circle. GPU timer, the East Field at 1536×1152 on this laptop's Radeon 840M: 0.9 ms (the near
  // patch 3.8; 80,000 blades without the thinning were 1.9). It's fill-bound: the vertices alone are 0.16 ms.
  const PATCH_F = 120, BLADES_F = 56000;
  const grassFar = (() => {
    const geo = new THREE.InstancedBufferGeometry(), U = grass.material.uniforms;
    geo.setAttribute('position', grass.geometry.attributes.position);
    geo.setIndex(grass.geometry.index);
    const off = new Float32Array(BLADES_F * 2), rnd = new Float32Array(BLADES_F * 4), R = rng(7);
    for (let i = 0; i < BLADES_F; i++) { off[i * 2] = R() * PATCH_F; off[i * 2 + 1] = R() * PATCH_F; rnd.set([R(), 0.35 + R() * 0.65, R(), R()], i * 4); }
    geo.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2));
    geo.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 4));
    geo.instanceCount = BLADES_F;
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      // (the near patch's own uniform objects: the map, time, fog and the realm's tint stay one setting for both)
      uniforms: Object.assign({ uMap: U.uMap, uTime: U.uTime, uCenter: { value: new THREE.Vector2() }, uInner: U.uCenter, uFog: U.uFog, uFogNear: U.uFogNear, uFogFar: U.uFogFar, uTint: U.uTint }, LANDU),
      vertexShader: `${MAPGLSL}${LANDGLSL}
        uniform float uTime; uniform vec2 uCenter; uniform vec2 uInner;
        attribute vec2 aOff; attribute vec4 aRnd;
        varying float vY; varying float vFogD; varying vec3 vCol;
        void main() {
          vec2 wp = aOff + ${fl(PATCH_F)} * floor((uCenter - aOff) / ${fl(PATCH_F)} + 0.5);
          vec4 m = mapAt(wp);
          float lk = landK(wp);
          float edge = 1.0 - smoothstep(${fl(PATCH_F * 0.27)}, ${fl(PATCH_F * 0.49)}, length(wp - uCenter));     // 1 inside, 0 at the far edge
          float inner = smoothstep(${fl(PATCH * 0.3)}, ${fl(PATCH * 0.49)}, length(wp - uInner));                  // 0 where the near patch is whole
          float amt = m.g;
          float keep = step(1.0 - amt, aRnd.y * 0.999) * step(fract(aRnd.x * 13.7), edge * 1.2) * step(fract(aRnd.z * 7.9 + aRnd.w * 3.1), inner * 1.05);
          keep *= step(fract(aRnd.y * 31.7 + aRnd.x * 5.3), clamp(26.0 / max(1.0, length(wp - cameraPosition.xz)), 0.35, 1.0));
          float town = 1.0 - smoothstep(-5.0, -1.0, min(length(wp - vec2(${fl(L.town.x)}, ${fl(L.town.z)})) - ${fl(L.town.r)},
                                                         length(wp - vec2(${fl(L.molinar.x)}, ${fl(L.molinar.z)})) - ${fl(L.molinar.r)}));
          float bh = (0.3 + 0.52 * aRnd.y) * mix(0.45, 1.0, edge) * keep * (0.55 + 0.45 * amt) * (1.0 - 0.6 * town);
          bh *= mix(1.0, uLandH, lk);
          float bw = (0.075 + 0.05 * aRnd.z) * 1.7;
          float ang = aRnd.x * 6.2831;
          vec3 p = vec3(cos(ang) * position.x * bw, position.y * bh, sin(ang) * position.x * bw);
          float bend = position.y * position.y;
          float calm = 1.0 - m.b * 0.85;
          float wv = sin(uTime * 1.7 + wp.x * 0.33 + wp.y * 0.21) * 0.55 + sin(uTime * 3.3 + wp.x * 1.1 + wp.y * 0.7) * 0.15 + 0.45;
          p.xz += vec2(0.85, 0.4) * wv * 0.42 * bend * bh * calm;
          vec4 mv = modelViewMatrix * vec4(vec3(wp.x, m.r - 0.03, wp.y) + p, 1.0);
          gl_Position = projectionMatrix * mv;
          vY = position.y; vFogD = -mv.z;
          float dry = smoothstep(0.35, 1.0, sin(wp.x * 0.045 + 1.0) * sin(wp.y * 0.06 - 0.5) + 0.35);
          vec3 base = vec3(0.24, 0.5, 0.2), tip = mix(vec3(0.62, 0.84, 0.36), vec3(0.86, 0.85, 0.47), dry);
          vec3 c = mix(base, tip, position.y) * (0.86 + 0.28 * aRnd.w);
          vec3 ground = mix(vec3(0.31, 0.58, 0.251), vec3(0.4, 0.643, 0.278), 0.5 + 0.5 * sin(wp.x * 0.13 + cos(wp.y * 0.11) * 2.0)) * vec3(1.1, 1.1, 1.06) / (0.78 + 0.22 * position.y);
          c = mix(c, mix(uLandBase, uLandTip, position.y) * (0.86 + 0.28 * aRnd.w), lk);
          ground = mix(ground, uLandBase * 1.1 / (0.78 + 0.22 * position.y), lk);
          c = mix(ground, c, 0.15 + 0.85 * smoothstep(0.0, 0.7, edge));
          c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(0.95, 0.95, 1.0), m.b * 0.8);
          vCol = c;
        }`,
      fragmentShader: grass.material.fragmentShader,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.name = 'grass-far'; return mesh;
  })();
  scene.add(grassFar);
  const gDir = new THREE.Vector3();

  // ------------------------------------------------------------ water: the stream and the pond
  // (far: the Mirror Lake's open water past the map's west edge, deep everywhere, with no map under it)
  const waterSrc = far => ({
    vertexShader: 'varying vec2 vXZ; varying float vFogD; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vXZ = w.xz; vec4 mv = viewMatrix * w; vFogD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `${MAPGLSL}
      uniform float uTime; uniform vec3 uFog; uniform float uFogNear, uFogFar; varying vec2 vXZ; varying float vFogD;
      void main() {
        vec4 m = ${far ? `vec4(${fl(L.lake.bed)}, 0.0, 0.0, 0.0)` : 'mapAt(vXZ)'};
        float d = ${fl(L.water)} - m.r;
        if (d < 0.0) discard;
        vec3 col = mix(vec3(0.42, 0.8, 0.84), vec3(0.15, 0.48, 0.72), smoothstep(0.0, 1.3, d));
        col = mix(col, vec3(0.55, 0.6, 0.65), m.b * 0.6);
        float edge = 0.1 + 0.05 * sin(uTime * 1.8 + vXZ.x * 1.3 + vXZ.y * 0.9);
        col = mix(col, vec3(0.95, 0.99, 1.0), (1.0 - smoothstep(edge * 0.6, edge, d)) * 0.95);
        float sp = sin(vXZ.x * 2.3 + uTime * 1.2) * sin(vXZ.y * 2.7 - uTime * 0.9) * sin(vXZ.x * 0.7 - vXZ.y * 1.3 + uTime * 0.5);
        col += smoothstep(0.55, 0.75, sp) * 0.28 * (1.0 - m.b);
        gl_FragColor = vec4(mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD)), 0.92);
      }`,
  });
  const waterMat = new THREE.ShaderMaterial(Object.assign({ transparent: true, side: THREE.DoubleSide,
    uniforms: { uMap: { value: mapTex }, uTime: time, uFog: { value: scene.fog.color }, uFogNear: { value: 45 }, uFogFar: { value: 240 } } }, waterSrc(false)));
  const farWaterMat = new THREE.ShaderMaterial(Object.assign({ transparent: true, side: THREE.DoubleSide, uniforms: waterMat.uniforms }, waterSrc(true)));
  {
    const pos = [], idx = [];
    for (let x = L.minX, i = 0; x <= L.maxX; x += 1, i++) {
      const z = streamZ(x);
      pos.push(x, L.water, z - 3.2, x, L.water, z + 3.2);
      if (i) idx.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    scene.add(new THREE.Mesh(g, waterMat));
    // the creek the road crosses
    const cp = [], ci = [];
    for (let x = L.minX, i = 0; x <= L.maxX; x += 1, i++) { const z = creekZ(x); cp.push(x, L.water, z - 3, x, L.water, z + 3); if (i) ci.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1); }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); cg.setIndex(ci);
    scene.add(new THREE.Mesh(cg, waterMat));
    L.ponds.forEach(p => { const m = new THREE.Mesh(new THREE.CircleGeometry(p.r * 1.35, 48), waterMat); m.rotation.x = -Math.PI / 2; m.position.set(p.x, L.water, p.z); scene.add(m); });
    // the Reed River (north–south, west of Alba) and the Mirror Lake
    if (L.river) {
      const rp = [], ri = []; let i = 0;
      for (let z = L.river.z0 - 6; z <= L.river.z1 + 1; z += 1, i++) { const x = riverX(z); rp.push(x - 4.2, L.water, z, x + 4.2, L.water, z); if (i) ri.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1); }   // (wound to face up)
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setIndex(ri);
      scene.add(new THREE.Mesh(rg, waterMat));
    }
    // the Mirror Lake: one sheet over its whole basin (the map says where the water is, east of the river's banks); past the map's
    // west edge, the far water, deep all the way out into the haze, over a bed the color of the near one (world.js L.farLake)
    if (L.lake) { const x0 = L.minX, x1 = -156, z0 = -258, z1 = -104, m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), waterMat); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, L.water, (z0 + z1) / 2); scene.add(m); }
    if (L.farLake) {
      const geo = new THREE.ShapeGeometry(new THREE.Shape(L.farLake.map(([x, z]) => new THREE.Vector2(x, -z)))); geo.rotateX(-Math.PI / 2);     // (shape y = −z)
      const w = new THREE.Mesh(geo, farWaterMat); w.position.y = L.water; scene.add(w);
      const bed = new THREE.Mesh(geo, toon('#9c8c62', { rim: 0 })); bed.position.y = L.lake.bed - 0.02; scene.add(bed);
    }
    // Port Brisa's sea (port.js): its sheet over the bay, the open sea and the moat, and past the map's west edge the far water
    if (typeof PORT !== 'undefined') {
      for (const b of PORT.WATER || []) { const m = new THREE.Mesh(new THREE.PlaneGeometry(b.x1 - b.x0, b.z1 - b.z0), waterMat); m.rotation.x = -Math.PI / 2; m.position.set((b.x0 + b.x1) / 2, L.water, (b.z0 + b.z1) / 2); scene.add(m); }
      if (PORT.FARSEA) {
        const geo = new THREE.ShapeGeometry(new THREE.Shape(PORT.FARSEA.map(([x, z]) => new THREE.Vector2(x, -z)))); geo.rotateX(-Math.PI / 2);
        const w = new THREE.Mesh(geo, farWaterMat); w.position.y = L.water; scene.add(w);
        const bed = new THREE.Mesh(geo, toon('#8f8a66', { rim: 0 })); bed.position.y = L.lake.bed - 0.02; scene.add(bed);
      }
    }
  }
  // stepping stones where the path crosses the stream
  [[1.6, -0.8], [3.0, 0.6], [4.4, -0.4], [2.2, 1.9]].forEach(([dx, dz], i) => {
    const x = 2.2 + dx - 2, z = streamZ(2.2 + dx - 2) + dz;
    const s = new THREE.Mesh(G.ico1, toon('#a7a597', { rim: 0.2 })); s.scale.set(0.62, 0.3, 0.55); s.position.set(x, L.water + 0.08, z); s.rotation.y = i; s.castShadow = s.receiveShadow = true; scene.add(s);
  });

  // ------------------------------------------------------------ the forest: instanced trees that sway
  const swayMats = [];
  // Trees sway, and dissolve (dithered) when they're right in front of the camera or between
  // the camera and you, so the forest never blocks the view.
  const fadeU = { uCamPos: { value: new THREE.Vector3() }, uFocus: { value: new THREE.Vector3() } };
  function swayToon(rim) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, fadeU, { uTime: time, rimAmt: { value: rim } });
      sh.vertexShader = 'uniform float uTime;\nvarying vec3 vWP;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.29;
          float k = smoothstep(1.5, 5.0, position.y);
          transformed.x += sin(uTime * 1.25 + ph) * 0.09 * k;
          transformed.z += sin(uTime * 0.9 + ph * 1.7) * 0.06 * k;
        #endif`).replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.fragmentShader = 'uniform float rimAmt;\nuniform vec3 uCamPos;\nuniform vec3 uFocus;\nvarying vec3 vWP;\n' + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          vec3 seg = uFocus - uCamPos; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
          vec3 rel = vWP - uCamPos; float along = dot(rel, dir);
          float axis = length(rel - dir * along);
          float occl = step(0.0, along) * step(along, segL - 0.8) * (1.0 - smoothstep(0.8, 2.0, axis));
          float nearCam = 1.0 - smoothstep(1.8, 4.2, length(rel));
          if (nearCam > 0.8) discard;      // (all the way gone right by the camera: a few leftover dots read as specks)
          float fadeAmt = max(occl * 0.88, nearCam);
          if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard;`)
        .replace('#include <tonemapping_fragment>',
          'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
    };
    m.customProgramCacheKey = () => 'sway' + rim;
    swayMats.push(m); return m;
  }
  const TREE_GEO = {
    round: merge([{ geo: new THREE.CylinderGeometry(0.2, 0.34, 2.4, 7), m: M4(0, 1.2, 0, 1), color: '#8a5f3e' },
      ...[[0, 3.0, 0, 1.25], [0.9, 2.6, 0.3, 0.95], [-0.85, 2.7, -0.2, 1.0], [0.2, 3.7, -0.3, 0.9], [-0.3, 2.5, 0.85, 0.85], [0.4, 2.6, -0.85, 0.85]]
        .map(([x, y, z, r], i) => ({ geo: G.ico1, m: M4(x, y, z, r), color: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#4b973f'][i] }))]),
    pine: merge([{ geo: new THREE.CylinderGeometry(0.18, 0.3, 1.8, 7), m: M4(0, 0.9, 0, 1), color: '#7d553a' },
      ...[[1.0, 2.0, 2.2], [0.82, 3.1, 1.9], [0.6, 4.0, 1.5]].map(([r, y, h], i) => ({ geo: new THREE.ConeGeometry(r * 1.6, h * 1.4, 9), m: M4(0, y, 0, 1), color: ['#3f8a4e', '#468f55', '#529c5d'][i] }))]),
    birch: merge([{ geo: new THREE.CylinderGeometry(0.15, 0.22, 3.4, 7), m: M4(0, 1.7, 0, 1), color: '#efe9dc' },
      ...[[0, 3.6, 0, 0.9], [0.5, 3.1, 0.3, 0.7], [-0.5, 3.2, -0.2, 0.75], [0.1, 4.2, -0.2, 0.65]].map(([x, y, z, r], i) => ({ geo: G.ico1, m: M4(x, y, z, r), color: ['#8fc45a', '#9dcc63', '#86bb52', '#a7d36d'][i] }))]),
    big: merge([{ geo: new THREE.CylinderGeometry(0.35, 0.6, 3.2, 9), m: M4(0, 1.6, 0, 1), color: '#7c5436' },
      ...[[0, 4.2, 0, 1.9], [1.5, 3.7, 0.4, 1.4], [-1.4, 3.8, -0.3, 1.5], [0.3, 5.2, -0.4, 1.3], [-0.5, 3.6, 1.3, 1.3], [0.6, 3.7, -1.3, 1.3]]
        .map(([x, y, z, r], i) => ({ geo: G.ico1, m: M4(x, y, z, r), color: ['#4a9440', '#55a346', '#4f9c3f', '#62b04c', '#4b973f', '#5aa84a'][i] }))]),
  };
  // simpler trees for the dense walls at the edges and the woods past the map (there are thousands)
  const LOW_GEO = {
    round: merge([{ geo: new THREE.CylinderGeometry(0.22, 0.36, 2.4, 5), m: M4(0, 1.2, 0, 1), color: '#7f573a' },
      ...[[0, 3.0, 0, 1.4], [0.85, 2.6, 0.2, 1.0], [-0.8, 2.7, -0.2, 1.05]].map(([x, y, z, r], i) => ({ geo: G.ico0, m: M4(x, y, z, r), color: ['#4a9440', '#55a346', '#468c3c'][i] }))], true),
    pine: merge([{ geo: new THREE.CylinderGeometry(0.18, 0.3, 1.8, 5), m: M4(0, 0.9, 0, 1), color: '#755037' },
      ...[[1.0, 2.0, 2.2], [0.75, 3.3, 2.0]].map(([r, y, h], i) => ({ geo: new THREE.ConeGeometry(r * 1.7, h * 1.5, 6), m: M4(0, y, 0, 1), color: ['#3c8449', '#468f55'][i] }))]),
  };
  // Instanced trees, split into tiles of the map, so the camera and the shadow camera skip the tiles
  // out of view (one instanced mesh per tile, whose bounding sphere wraps its trees). The geometry
  // objects share their buffers; only the bounding sphere differs.
  const TILE = 48, tilesBuilt = [];
  function tiled(list, geo, mat, place, shadows, size = TILE) {
    const tiles = new Map();
    list.forEach(t => { const k = Math.floor(t.x / size) * 1000 + Math.floor(t.z / size); if (!tiles.has(k)) tiles.set(k, []); tiles.get(k).push(t); });
    const m = new THREE.Matrix4(), c = new THREE.Color();
    tiles.forEach(ts => {
      const g = new THREE.BufferGeometry();
      Object.keys(geo.attributes).forEach(a => g.setAttribute(a, geo.attributes[a])); if (geo.index) g.setIndex(geo.index);
      const im = new THREE.InstancedMesh(g, mat, ts.length);
      let cx = 0, cz = 0, y0 = 1e9, y1 = -1e9, r = 0;
      ts.forEach((t, i) => { const y = place(t, m, c); im.setMatrixAt(i, m); im.setColorAt(i, c); t._im = im; t._i = i; cx += t.x; cz += t.z; y0 = Math.min(y0, y); y1 = Math.max(y1, y); });     // (t._im, t._i: each tree's instance, so TIME.land can swap it for another plant and back)
      cx /= ts.length; cz /= ts.length; ts.forEach(t => { r = Math.max(r, Math.hypot(t.x - cx, t.z - cz) + 4 * t.s); });
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, (y0 + y1) / 2 + 3, cz), Math.hypot(r, (y1 - y0) / 2 + 6));
      im.castShadow = shadows; im.receiveShadow = shadows; im.frustumCulled = true;
      scene.add(im); tilesBuilt.push(im);
    });
  }
  const tq = new THREE.Quaternion(), te = new THREE.Euler(), tpv = new THREE.Vector3(), tsv = new THREE.Vector3();
  Object.keys(TREE_GEO).forEach(kind => {
    const list = WORLD.trees.filter(t => t.kind === kind && !t.wall);
    if (!list.length) return;
    tiled(list, TREE_GEO[kind], swayToon(0.26), (t, m, c) => {
      const y = WORLD.terrainAt(t.x, t.z) - 0.1;
      m.compose(tpv.set(t.x, y, t.z), tq.setFromEuler(te.set(0, t.seed * TAU, 0)), tsv.set(t.s, t.s, t.s));
      const tint = 0.88 + t.seed * 0.22; c.setRGB(tint, tint, tint * (0.95 + 0.1 * t.seed));
      return y;
    }, true);
  });
  // The dense wall trees, and the woods that carry on past the map into the fog (on a wide
  // ground that meets the hills at the map's edge), so the world never just ends (DESIGN.md 12.11).
  const outer = [];
  // the Mirror Lake's far water past the map's west edge (world.js L.farLake): no woods on it
  const FAR = L.farLake || [], inFar = (x, z) => { let c = false; for (let i = 0, j = FAR.length - 1; i < FAR.length; j = i++) { const [xi, zi] = FAR[i], [xj, zj] = FAR[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  {
    const R = rng(91), skip = (x, z) => Math.hypot(x - L.tower.x, z - L.tower.z) < 30 || (typeof CAVES !== 'undefined' && CAVES.noOuterTree(x, z))   // (the quarry's mountains stand there: caves.js)
      || (typeof PEAKS !== 'undefined' && PEAKS.noOuterTree(x, z))      // (and the Frost Peaks: peaks.js)
      || inFar(x, z) || (typeof lakeD === 'function' && x < L.minX + 8 && lakeD(Math.max(x, L.minX), z) < 6)     // (nor on the lake where it runs out past the map's edge)
      || (typeof PORT !== 'undefined' && PORT.noOuterTree && PORT.noOuterTree(x, z));     // (nor on Port Brisa's sea, out past the map's west edge: port.js)
    for (let n = 0; n < 9000 && outer.length < 2600; n++) {
      const x = lerp(L.minX - 150, L.maxX + 150, R()), z = lerp(L.minZ - 150, L.maxZ + 110, R());
      const inside = x > L.minX + 4 && x < L.maxX - 4 && z > L.minZ + 4 && z < L.maxZ - 4;
      if (inside || skip(x, z) || (z > L.maxZ - 2 && Math.abs(x) < 20)) continue;
      if (WORLD.TRACK.dist(x, z) < 6 && WORLD.TRACK.past(x, z) < 3.5) continue;     // (the railway's cutting)
      outer.push({ x, z, s: 1.1 + R() * 0.9, kind: R() < 0.55 ? 'pine' : 'round', seed: R() });
    }
  }
  // (a square with the map cut out: a full plane at this height covered the whole map whenever the
  // camera rose above it, on the lookout, the hill and in crane shots)
  const ground = (() => {
    const cx = (L.minX + L.maxX) / 2, cz = (L.minZ + L.maxZ) / 2, v = (x, y) => new THREE.Vector2(x, y);
    const sh = new THREE.Shape([v(-700, -700), v(700, -700), v(700, 700), v(-700, 700)]);
    const x0 = L.minX + 3 - cx, x1 = L.maxX - 3 - cx, z0 = L.minZ + 3 - cz, z1 = L.maxZ - 3 - cz;   // (shape y = -(z - cz))
    // (the hole runs on out west where the Mirror Lake's far water is, between the hills of its far shores)
    const far = FAR.map(([x, z], i) => v(i === 0 || i === FAR.length - 1 ? x0 : x - cx, -(z - cz)));
    // (and again further south, where Port Brisa's sea runs out past the edge between its shores: port.js FARSEA)
    const FS = (typeof PORT !== 'undefined' && PORT.FARSEA) || [], sea = FS.map(([x, z], i) => v(i === 0 || i === FS.length - 1 ? x0 : x - cx, -(z - cz)));
    sh.holes.push(new THREE.Path([v(x0, -z0), ...far, ...sea, v(x0, -z1), v(x1, -z1), v(x1, -z0)]));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), toon('#3d7a35', { rim: 0 }));
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 7.6, cz); m.receiveShadow = false;
    return m;
  })();
  scene.add(ground);
  // The far water's shores: a wooded ridge along each side of it, from the map's edge out into the haze, rising from under the
  // water over the ground's edge (so no gap shows under it), with round hills behind and pines along the top. One mesh.
  if (FAR.length > 3) {
    const R = rng(808), pieces = [], pos = [], col = [], idx = [], c = new THREE.Color(), n2 = FAR.length / 2, cone = new THREE.ConeGeometry(1, 1, 6), dome = new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2);
    const sides = [[[-456, FAR[0][1]], ...FAR.slice(0, n2)], [[-456, FAR[FAR.length - 1][1]], ...FAR.slice(n2).reverse()]], south = [0, 1];
    // (Port Brisa's sea past the map's west edge has a shore each side too, built the same way: port.js FARSHORES, out −1 / 1)
    const PS = typeof PORT !== 'undefined' && PORT.FARSHORES ? PORT.FARSHORES : [];
    for (const s of PS) { sides.push(s.line); south.push(s.out > 0 ? 1 : 0); }
    const seaNear = (x, z, r) => typeof PORT !== 'undefined' && PORT.farSeaD && Math.min(PORT.farSeaD(x, z), PORT.seaD(Math.max(x, -469), z)) < r;     // (a far hill that would sit in that sea)
    const PROF = [[-18, -3.5], [-9, 1.6], [-3, 5.6], [4, 9.4], [13, 10.2], [24, 7.0]];      // across the ridge: water side → ground side
    const profY = o => { for (let k = 1; k < PROF.length; k++) if (o <= PROF[k][0]) return lerp(PROF[k - 1][1], PROF[k][1], (o - PROF[k - 1][0]) / (PROF[k][0] - PROF[k - 1][0])); return PROF[PROF.length - 1][1]; };
    sides.forEach((line, sn) => {
      const si = south[sn];
      const pts = [];
      for (let i = 0; i < line.length - 1; i++) { const [ax, az] = line[i], [bx, bz] = line[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 6); for (let k = 0; k < n; k++) pts.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]); }
      pts.push(line[line.length - 1]);
      const base = pos.length / 3, out = si === 0 ? -1 : 1;          // (away from the water: north for the north shore, south for the south one)
      pts.forEach(([x, z], i) => {
        const [ax, az] = pts[Math.max(0, i - 1)], [bx, bz] = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l, nz = (bx - ax) / l, s = Math.sign(nz * out) || 1;
        const rise = smoothstep(0, 16, Math.hypot(x - pts[0][0], z - pts[0][1]));      // (it rises out of the map's own shore hills, no cut end)
        PROF.forEach(([o, y], k) => {
          const w = k > 0 && k < PROF.length - 1 ? 1.0 * Math.sin(x * 0.07 + k * 1.3 + si * 2) + 0.8 * Math.sin(x * 0.19 + k) : 0;
          pos.push(x + nx * s * o, lerp(-2.6, y + w, rise), z + nz * s * o);
          c.set(k < 1 ? '#8f8a6a' : k > 3 ? '#3f7a37' : (i + k) % 3 ? '#4a8a3e' : '#3d7a3a'); col.push(c.r, c.g, c.b);
        });
        if (i) for (let k = 0; k < PROF.length - 1; k++) { const a = base + (i - 1) * PROF.length + k, b = a + PROF.length; if (si) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b); }     // (wound to face up)
        if (i % 2 === 0 && rise > 0.95) for (let t = 0; t < 2; t++) { const o = 1 + R() * 16, h = 4 + R() * 3; pieces.push({ geo: cone, m: M4(x + nx * s * o + (R() - 0.5) * 3, profY(o) - 2 + h / 2, z + nz * s * o + (R() - 0.5) * 3, 1.3 + R() * 0.8, h, 1.3 + R() * 0.8), color: R() < 0.5 ? '#2f6b3c' : '#3a7a44' }); }
        if (i % 7 === 3 && sn < 2) { const o = 30 + R() * 16, r = 22 + R() * 16, h = 12 + R() * 14, hx = x + nx * s * o, hz = z + nz * s * o, color = R() < 0.5 ? '#4f8f43' : '#5a9a4b'; if (!seaNear(hx, hz, r * 0.9)) pieces.push({ geo: dome, m: M4(hx, 3, hz, r, h, r * 0.85), color }); }
      });
    });
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); rg.setIndex(idx);
    const ridge = rg.toNonIndexed(); ridge.computeVertexNormals();
    const rest = merge(pieces), all = new THREE.BufferGeometry();
    ['position', 'normal', 'color'].forEach(k => { const a = ridge.attributes[k].array, b = rest.attributes[k].array, o = new Float32Array(a.length + b.length); o.set(a); o.set(b, a.length); all.setAttribute(k, new THREE.BufferAttribute(o, 3)); });
    const shores = new THREE.Mesh(all, toon('#ffffff', { vc: 1, rim: 0 }));
    shores.name = 'far-shores'; scene.add(shores);
  }
  const edgeY = (x, z) => (x > L.minX + 2 && x < L.maxX - 2 && z > L.minZ + 2 && z < L.maxZ - 2) ? WORLD.terrainAt(x, z) - 0.1 : 7.6;
  // wall trees cast shadows (you walk right up to them); the woods past the map don't (they're far
  // outside the shadow camera, and there are thousands)
  const lowMats = {};
  // (the woods round the grown Mirror Lake, world.js `far`: seen from the water, never walked through, so big tiles and no shadows)
  [[WORLD.trees.filter(t => t.wall && !t.far), true], [outer, false], [WORLD.trees.filter(t => t.far), false, 112]].forEach(([all, shadows, size]) => Object.keys(LOW_GEO).forEach(kind => {
    const list = all.filter(t => t.kind === kind);
    if (!list.length) return;
    tiled(list, LOW_GEO[kind], lowMats[kind] || (lowMats[kind] = swayToon(0.18)), (t, m, c) => {
      const y = edgeY(t.x, t.z);
      m.compose(tpv.set(t.x, y, t.z), tq.setFromEuler(te.set(0, t.seed * TAU, 0)), tsv.set(t.s, t.s * (0.95 + t.seed * 0.25), t.s));
      const tint = 0.8 + t.seed * 0.2; c.setRGB(tint, tint, tint);
      return y;
    }, shadows, size);
  }));
  // rocks
  W_ROCKS: {
    const geo = new THREE.DodecahedronGeometry(1, 0), mossGeo = new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI * 0.32);
    const im = new THREE.InstancedMesh(geo, toon('#a3a196', { rim: 0.2 }), WORLD.rocks.length);
    const moss = new THREE.InstancedMesh(mossGeo, toon('#5d8f3e', { rim: 0.1 }), WORLD.rocks.length);
    const m = new THREE.Matrix4();
    WORLD.rocks.forEach((r, i) => {
      const y = WORLD.terrainAt(r.x, r.z) + r.s * 0.2, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(r.seed, r.seed * 7, r.seed * 3));
      im.setMatrixAt(i, m.compose(new THREE.Vector3(r.x, y, r.z), q, new THREE.Vector3(r.s * 1.15, r.s * 0.75, r.s)));
      moss.setMatrixAt(i, m.compose(new THREE.Vector3(r.x, y + r.s * 0.12, r.z), new THREE.Quaternion(), r.moss ? new THREE.Vector3(r.s * 1.05, r.s * 0.72, r.s * 0.95) : new THREE.Vector3(0, 0, 0)));
    });
    im.castShadow = im.receiveShadow = true; im.frustumCulled = moss.frustumCulled = false;
    scene.add(im, moss);
  }
  // ferns: a fan of leaves
  {
    const leaves = [];
    for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; leaves.push({ geo: G.ico1, m: M4(Math.cos(a) * 0.32, 0.2, Math.sin(a) * 0.32, 0.07, 0.025, 0.42, -a + Math.PI / 2, 0.7, 0), color: i % 2 ? '#3f8a3a' : '#4c9a40' }); }
    const im = new THREE.InstancedMesh(merge(leaves), swayToon(0.15), WORLD.ferns.length);
    const m = new THREE.Matrix4();
    WORLD.ferns.forEach((f, i) => im.setMatrixAt(i, m.compose(new THREE.Vector3(f.x, WORLD.terrainAt(f.x, f.z), f.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, f.r, 0)), new THREE.Vector3(f.s, f.s, f.s))));
    im.frustumCulled = false; scene.add(im);
  }
  // mushrooms, and the glowing fairy ring
  {
    const shroom = (cap) => merge([{ geo: new THREE.CylinderGeometry(0.06, 0.08, 0.3, 7), m: M4(0, 0.15, 0, 1), color: '#f3ead6' },
      { geo: new THREE.SphereGeometry(1, 12, 8, 0, TAU, 0, Math.PI / 2), m: M4(0, 0.28, 0, 0.2, 0.15, 0.2), color: cap }]);
    [['#d9493b', true], ['#c99a5b', false]].forEach(([cap, red]) => {
      const list = WORLD.shrooms.filter(s => s.red === red);
      const im = new THREE.InstancedMesh(shroom(cap), toon('#ffffff', { vc: 1, rim: 0.3 }), list.length);
      const m = new THREE.Matrix4();
      list.forEach((s, i) => { im.setMatrixAt(i, m.compose(new THREE.Vector3(s.x, WORLD.terrainAt(s.x, s.z) - 0.02, s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s.seed * 6, (s.seed - 0.5) * 0.3)), new THREE.Vector3(s.s, s.s, s.s))); s._im = im; s._i = i; });
      im.frustumCulled = false; scene.add(im);
    });
  }
  // The fairy ring's glowing mushrooms are the ones Marta wants: while her quest is on
  // (ring.active), they glow brighter and sparkle so you can't miss them.
  const ringMat = new THREE.MeshToonMaterial({ color: '#9ff5e8', emissive: new THREE.Color('#2fd0c2'), gradientMap: TK.grad });
  const ringGlow = [], ringGroups = [], ring = { active: false, cool: 0 };
  WORLD.ring.forEach((s, i) => {
    const g = new THREE.Group(); g.position.set(s.x, WORLD.terrainAt(s.x, s.z) - 0.02, s.z); g.scale.setScalar(s.s * 1.6);
    g.add(part(new THREE.CylinderGeometry(0.06, 0.08, 0.3, 7), '#f3ead6', [0, 0.15, 0], null, { ink: 0 }));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, TAU, 0, Math.PI / 2), ringMat); cap.scale.y = 0.75; cap.position.y = 0.28; g.add(cap);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#8ff8ec', transparent: true, opacity: 0.5, depthWrite: false })); glow.scale.setScalar(1.1); glow.position.y = 0.35; g.add(glow);
    ringGlow.push(glow); ringGroups.push(g); scene.add(g);
  });

  // The Hush rolling in: a bank of gray fog that sweeps south over the treetops.
  const waves = [];
  function hushWave(cx, cz) {
    for (let i = 0; i < 56; i++) {
      const m = new THREE.Mesh(G.ico, new THREE.MeshBasicMaterial({ color: i % 3 ? '#b7b5c6' : '#a9a7ba', transparent: true, opacity: 0, depthWrite: false, fog: false }));
      const x = cx + (i / 55 - 0.5) * 96 + (Math.random() - 0.5) * 5, z = cz + (Math.random() - 0.5) * 10;
      m.position.set(x, WORLD.terrainAt(clamp(x, L.minX, L.maxX), clamp(z, L.minZ, L.maxZ)) + 3 + Math.random() * 10, z);
      const s = 2.6 + Math.random() * 3.6; m.scale.set(s * 1.4, s, s);
      scene.add(m); waves.push({ m, vz: 18 + Math.random() * 4, life: 0, max: 4.4 + Math.random() * 0.8, s });
    }
  }
  // flowers
  {
    const n = WORLD.flowers.length;
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 4), toon('#3f8a3a', { rim: 0 }), n);
    const heads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 0), toon('#ffffff', { rim: 0.2 }), n);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    WORLD.flowers.forEach((f, i) => {
      const y = WORLD.terrainAt(f.x, f.z);
      stems.setMatrixAt(i, m.compose(new THREE.Vector3(f.x, y + 0.17 * f.s, f.z), new THREE.Quaternion(), new THREE.Vector3(f.s, f.s, f.s)));
      heads.setMatrixAt(i, m.compose(new THREE.Vector3(f.x, y + 0.36 * f.s, f.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(f.seed, f.seed * 5, 0)), new THREE.Vector3(f.s, f.s * 0.6, f.s)));
      heads.setColorAt(i, c.set(f.col));
    });
    stems.frustumCulled = heads.frustumCulled = false; scene.add(stems, heads);
  }
  // fallen logs (one is a bridge over the stream)
  WORLD.logs.forEach(l => {
    const len = Math.hypot(l.x2 - l.x1, l.z2 - l.z1), mx = (l.x1 + l.x2) / 2, mz = (l.z1 + l.z2) / 2;
    const g = new THREE.Group(); g.position.set(mx, l.bridge ? 0.04 : WORLD.terrainAt(mx, mz) + l.r * 0.7, mz); g.rotation.y = Math.atan2(l.x2 - l.x1, l.z2 - l.z1);
    const log = new THREE.Mesh(new THREE.CylinderGeometry(l.r, l.r * 1.08, len, 12), toon('#8a5f3e', { rim: 0.2 })); log.rotation.x = Math.PI / 2; log.castShadow = log.receiveShadow = true; g.add(log);
    [-1, 1].forEach(s => { const ring = new THREE.Mesh(new THREE.CircleGeometry(l.r * 0.98, 14), toon('#d8b07a', { rim: 0 })); ring.position.z = s * len / 2; ring.rotation.y = s > 0 ? 0 : Math.PI; g.add(ring); });
    const moss = new THREE.Mesh(new THREE.CylinderGeometry(l.r * 1.02, l.r * 1.02, len * 0.6, 12, 1, true, -0.9, 1.8), toon('#5d8f3e', { rim: 0.1 })); moss.rotation.x = Math.PI / 2; moss.rotation.z = 0; g.add(moss);
    scene.add(g);
  });

  // ------------------------------------------------------------ the station and the train
  const station = new THREE.Group(); scene.add(station);
  const box = (g, w, h, d, x, y, z, color, o = {}) => { const m = new THREE.Mesh(G.box, toon(color, o)); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const S = L.station, STATION_C = { x: (S.x0 + S.x1) / 2, z: (S.z0 + S.z1) / 2 };
  box(station, S.x1 - S.x0, S.top, S.z1 - S.z0, (S.x0 + S.x1) / 2, S.top / 2, (S.z0 + S.z1) / 2, '#b08a5e', { rim: 0.1 });
  for (let x = S.x0 + 0.5, i = 0; x < S.x1; x += 1.1, i++) box(station, 1.0, 0.04, S.z1 - S.z0 - 0.1, x, S.top + 0.01, (S.z0 + S.z1) / 2, i % 2 ? '#c49b6a' : '#bb9363', { rim: 0 });
  box(station, S.x1 - S.x0 - 0.3, 0.02, 0.16, (S.x0 + S.x1) / 2, S.top + 0.035, S.z1 - 0.3, '#f2c94e', { rim: 0 });    // the yellow line at the track edge
  // the ramp down off the east end, and a fence from there along the track to the woods
  { const m = box(station, 3.47, 0.6, S.z1 - S.z0, 12.64, 0.066, (S.z0 + S.z1) / 2, '#a88358', { rim: 0.1 }); m.rotation.z = -0.197; }
  for (let x = 14.6; x < 26.2; x += 1.9) box(station, 0.16, 1.0, 0.16, x, 0.5, 65.7, '#8a5f3e');
  [0.45, 0.85].forEach(y => box(station, 11.6, 0.1, 0.07, 20.2, y, 65.7, '#c79d6d', { rim: 0.1 }));
  // the little station house on the platform's west end: ticket window, timetable, a door, and a clock
  {
    const H = L.stationHouse, y0 = S.top, x0 = H.x - H.w / 2, front = H.z + H.d / 2, back = H.z - H.d / 2;
    box(station, H.w, 2.8, H.d, H.x, y0 + 1.4, H.z, '#efe3c8', { rim: 0.12 });
    box(station, H.w + 0.06, 0.8, H.d + 0.06, H.x, y0 + 0.4, H.z, '#a8784e', { rim: 0.1 });
    [1, -1].forEach(s => { const r = box(station, H.w + 0.8, 0.18, 2.61, H.x, y0 + 3.35, H.z + s * 1.136, '#9c3b30', { rim: 0.2 }); r.rotation.x = s * 0.588; });
    const gable = new THREE.Shape([new THREE.Vector2(-H.d / 2, 0), new THREE.Vector2(H.d / 2, 0), new THREE.Vector2(0, 1.2)]);
    const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: H.w, bevelEnabled: false }), toon('#efe3c8', { rim: 0.12 }));
    gm.rotation.y = Math.PI / 2; gm.position.set(x0, y0 + 2.8, H.z); gm.castShadow = true; station.add(gm);
    box(station, 0.5, 1.4, 0.5, x0 + 1.6, y0 + 4.0, back + 0.9, '#8a5f3e');
    box(station, 1.1, 1.9, 0.08, H.x + 2.0, y0 + 0.95, front + 0.03, '#3f6f5a'); box(station, 0.12, 0.12, 0.1, H.x + 2.35, y0 + 0.95, front + 0.08, '#e8c46a');
    box(station, 1.9, 1.25, 0.05, H.x - 1.6, y0 + 1.75, front + 0.02, '#7a5a40'); box(station, 1.6, 0.95, 0.06, H.x - 1.6, y0 + 1.8, front + 0.04, '#a8e1f0', { rim: 0.5 });
    box(station, 1.9, 0.08, 0.4, H.x - 1.6, y0 + 1.12, front + 0.2, '#8a5f3e');
    box(station, 0.95, 1.1, 0.05, H.x + 0.35, y0 + 1.8, front + 0.03, '#2f3440');
    for (let i = 0; i < 4; i++) box(station, 0.6 - (i % 2) * 0.2, 0.05, 0.02, H.x + 0.3, y0 + 2.15 - i * 0.22, front + 0.06, '#e9e4d6', { rim: 0 });
    box(station, 1.4, 0.9, 0.06, H.x, y0 + 1.9, back - 0.02, '#a8e1f0', { rim: 0.5 });
    // the clock on its bracket at the front corner (stopped at eight o'clock)
    box(station, 0.7, 0.1, 0.1, x0 + H.w + 0.3, y0 + 3.0, front - 0.3, '#2f3440');
    const clock = new THREE.Group(); clock.position.set(x0 + H.w + 0.6, y0 + 2.6, front - 0.3); station.add(clock);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 24), [toon('#2f3440'), toon('#fdf8ee', { rim: 0 }), toon('#fdf8ee', { rim: 0 })]);
    face.rotation.z = Math.PI / 2; clock.add(face);
    [1, -1].forEach(s => { const hh = box(clock, 0.02, 0.2, 0.05, s * 0.08, -0.05, 0.087 * s, '#2b2235', { rim: 0 }); hh.rotation.x = -1.047 * s; box(clock, 0.02, 0.3, 0.04, s * 0.08, 0.15, 0, '#2b2235', { rim: 0 }); });
  }
  // the buffer stop at the end of the line
  {
    const a = WORLD.TRACK.at(0), g = new THREE.Group(); g.position.set(a.x - 0.4, 0, a.z); station.add(g);
    [-0.75, 0.75].forEach(z => box(g, 0.26, 1.0, 0.26, 0, 0.5, z, '#5b4636'));
    [-0.8, 0, 0.8].forEach((z, i) => box(g, 0.32, 0.36, 0.8, 0.05, 0.92, z, i % 2 ? '#fdf8ee' : '#d64b3c'));
    box(g, 0.22, 0.22, 0.22, 0, 1.25, 0, '#ff6a4a', { emissive: '#7a1a10' });
    box(g, 1.3, 0.14, 0.14, -0.55, 0.45, 0.75, '#5b4636').rotation.z = 0.6; box(g, 1.3, 0.14, 0.14, -0.55, 0.45, -0.75, '#5b4636').rotation.z = 0.6;
  }
  box(station, 4.8, 0.47, 1.2, 0, 0.235, 59.0, '#a88358'); box(station, 4.8, 0.24, 1.1, 0, 0.12, 57.85, '#a88358');
  box(station, 5.6, 0.12, 2.0, 8, 3.0, 63.4, '#c9553f'); [[5.4, 63.6], [10.6, 63.6]].forEach(([x, z]) => box(station, 0.16, 2.3, 0.16, x, S.top + 1.15, z, '#5b4636'));
  box(station, 2.4, 0.12, 0.5, 8, S.top + 0.5, 64.0, '#8a5f3e'); box(station, 2.4, 0.5, 0.1, 8, S.top + 0.8, 64.25, '#8a5f3e');
  const lamp = new THREE.Group(); lamp.position.set(-7, S.top, 60.3); station.add(lamp);
  box(lamp, 0.12, 2.6, 0.12, 0, 1.3, 0, '#2f3440'); box(lamp, 0.4, 0.35, 0.4, 0, 2.7, 0, '#f6e7a8', { emissive: '#7a6a20' });
  // the station sign: two posts and a board with the stop's name (drawn on a canvas, per language), on both faces: you
  // read it from the platform, and from the forest path on the way back (a box's back face isn't mirrored)
  const signCv = document.createElement('canvas'); signCv.width = 512; signCv.height = 128;
  const signTex = new THREE.CanvasTexture(signCv); signTex.anisotropy = 4;
  const signFace = new THREE.MeshToonMaterial({ map: signTex, gradientMap: TK.grad });
  const signBoard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.12), [toon('#e9dcc0'), toon('#e9dcc0'), toon('#e9dcc0'), toon('#e9dcc0'), signFace, signFace]);
  signBoard.position.set(0, S.top + 2.0, 60.3); signBoard.castShadow = true; station.add(signBoard);
  [-1.6, 1.6].forEach(x => box(station, 0.14, 2.0, 0.14, x, S.top + 1.0, 60.3, '#2f3440'));
  // E «Read» (signs.js: the words, a 🔊, the English); it stands where story.js's old thought was, and wins the tie
  if (typeof SIGNS !== 'undefined') SIGNS.add({ id: 'station', x: 0, z: 60.9, y: S.top, r: 2.4, card: l => ({ tag: 'The station sign', lines: [{ text: SIGN[l] || SIGN.es,
    en: { es: 'Last stop', pt: 'End of the line', de: 'Last stop (the end of the line)' }[l] || 'Last stop', look: { face: '#2b4a6b', edge: '#1c3148', ink: '#fffaf0' } }] }) });
  function drawSign(text) {
    const c = signCv.getContext('2d'); c.fillStyle = '#2b4a6b'; c.fillRect(0, 0, 512, 128);
    c.fillStyle = '#fffaf0'; c.fillRect(8, 8, 496, 112); c.fillStyle = '#2b4a6b'; c.fillRect(14, 14, 484, 100);
    c.fillStyle = '#fffaf0'; c.font = '800 54px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 256, 66);
    signTex.needsUpdate = true;
  }
  // the line (WORLD.TRACK): sleepers and rails from the buffer stop, past the station, off east into the
  // woods along a cutting, and into the tunnel (instanced: two draw calls)
  const TR = WORLD.TRACK;
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), sc = new THREE.Vector3();
    const end = TR.sPortal + 2.5, ties = [];
    for (let s = 0.3; s < end; s += 1.25) ties.push(s);
    const tieIM = new THREE.InstancedMesh(G.box, toon('#7b5a42', { rim: 0 }), ties.length);
    ties.forEach((s, i) => { const a = TR.at(s); q.setFromAxisAngle(up, Math.atan2(-a.uz, a.ux)); m4.compose(p.set(a.x, 0.07, a.z), q, sc.set(0.5, 0.14, 2.6)); tieIM.setMatrixAt(i, m4); });
    const segs = []; for (let i = 0; i < TR.pts.length - 1 && TR.len[i] < end; i++) segs.push(i);
    const railIM = new THREE.InstancedMesh(G.box, toon('#6c6f78', { rim: 0.4 }), segs.length * 2);
    segs.forEach((i, k) => {
      const [ax, az] = TR.pts[i], [bx, bz] = TR.pts[i + 1], l = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / l, uz = (bz - az) / l;
      q.setFromAxisAngle(up, Math.atan2(-uz, ux));
      [-0.75, 0.75].forEach((o, j) => { m4.compose(p.set((ax + bx) / 2 - uz * o, 0.19, (az + bz) / 2 + ux * o), q, sc.set(l + 0.03, 0.12, 0.12)); railIM.setMatrixAt(k * 2 + j, m4); });
    });
    [tieIM, railIM].forEach(m => { m.castShadow = m.receiveShadow = true; m.frustumCulled = false; scene.add(m); });
  }
  // the tunnel mouth, deep in the woods where the line curves away: a stone arch, and only dark inside
  {
    const P = TR.portal, g = new THREE.Group(); g.position.set(P.x, 0, P.z); g.rotation.y = Math.atan2(-P.ux, -P.uz); scene.add(g);
    const v = (x, y) => new THREE.Vector2(x, y);
    const sh = new THREE.Shape([v(-6.5, -1), v(6.5, -1), v(6.5, 7.8), v(-6.5, 7.8)]);
    const hole = new THREE.Path(); hole.moveTo(-2.1, -0.5); hole.lineTo(2.1, -0.5); hole.lineTo(2.1, 3.0); hole.absarc(0, 3.0, 2.1, 0, Math.PI, false); hole.lineTo(-2.1, -0.5);
    sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false }); geo.translate(0, 0, -1.4);
    const wall = new THREE.Mesh(geo, toon('#8f8a80', { rim: 0.15 })); wall.castShadow = wall.receiveShadow = true; g.add(wall);
    for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8, st = box(g, 0.55, 0.42, 0.25, Math.cos(a) * 2.35, 3.0 + Math.sin(a) * 2.35, 0.1, i % 2 ? '#a19b90' : '#7f7a71', { rim: 0.1 }); st.rotation.z = a - Math.PI / 2; }
    box(g, 0.75, 0.85, 0.3, 0, 5.45, 0.12, '#b5aea2');
    box(g, 13.4, 0.5, 1.8, 0, 7.9, -0.6, '#5d8f3e', { rim: 0.1 });
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.8), new THREE.MeshBasicMaterial({ color: '#0d0b10' })); dark.position.set(0, 2.4, -1.15); g.add(dark);
  }
  // the little train: it runs along the line by arc length (s at the loco's middle), the car coupled behind
  const train = new THREE.Group(); scene.add(train);
  const loco = new THREE.Group(), car = new THREE.Group(); train.add(loco, car);
  {
    box(loco, 4.2, 1.6, 2.2, 0, 1.3, 0, '#2f7f78'); box(loco, 1.8, 1.4, 2.3, -1.4, 2.6, 0, '#2f7f78');
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 3.0, 18), toon('#e0503f')); boiler.rotation.z = Math.PI / 2; boiler.position.set(0.9, 2.4, 0); boiler.castShadow = true; loco.add(boiler);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 1.0, 12), toon('#2b2235')); stack.position.set(1.8, 3.4, 0); loco.add(stack);
    box(loco, 2.1, 0.18, 2.5, -1.4, 3.35, 0, '#2b2235');
    [-1.3, 0, 1.3].forEach(x => [-1.15, 1.15].forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.2, 16), toon('#2b2235')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.55, z); loco.add(w); }));
    box(loco, 0.9, 0.7, 0.05, -1.4, 2.8, 1.18, '#a8e1f0', { rim: 0.5 }); box(loco, 0.9, 0.7, 0.05, -1.4, 2.8, -1.18, '#a8e1f0', { rim: 0.5 });
    box(car, 5.0, 2.2, 2.3, 0, 1.6, 0, '#f2c94e'); box(car, 5.3, 0.2, 2.6, 0, 2.8, 0, '#c9553f');
    [-1.6, 0, 1.6].forEach(x => { box(car, 1.0, 0.8, 0.05, x, 1.9, 1.17, '#a8e1f0', { rim: 0.5 }); box(car, 1.0, 0.8, 0.05, x, 1.9, -1.17, '#a8e1f0', { rim: 0.5 }); });
    [-1.6, 1.6].forEach(x => [-1.15, 1.15].forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16), toon('#2b2235')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, z); car.add(w); }));
  }
  // in at the platform ('here'), pulling out ('leaving'), off in the forest ('gone'), or backing in again
  // ('coming': it comes back now and then while you're around the station, and waits a while)
  const trainState = { s: TR.sStop, v: 0, mode: 'here', wait: 0, gone: 0, steam: 0, clack: 0 };
  const trainSfx = n => { if (typeof Sound !== 'undefined') Sound.play(n); };
  function placeTrain() {
    const a = TR.at(trainState.s), b = TR.at(trainState.s - 5.2);
    loco.position.set(a.x, 0.1, a.z); loco.rotation.y = Math.atan2(-a.uz, a.ux);
    car.position.set(b.x, 0.1, b.z); car.rotation.y = Math.atan2(-b.uz, b.ux);
  }
  placeTrain();

  // ------------------------------------------------------------ the old road: the creek bridge, farm fields, signposts
  // (the town of Alba itself is drawn by town.js)
  {
    const b = L.bridge, g = new THREE.Group(); g.position.set(b.x, 0, b.z); g.rotation.y = Math.atan2(b.ux, b.uz); scene.add(g);
    // (baked: the planks in one mesh, the rails, posts and stones in another, each box's color in its vertices. It was 35 boxes,
    // 35 draw calls, in view from all of Alba's south side; the cleanup pass, 2026-11-20)
    const planks = [], frame = [], B = (list, w, h, d, x, y, z, color) => list.push({ geo: G.box, m: M4(x, y, z, w, h, d), color });
    for (let k = -3.8; k <= 3.81; k += 0.55) B(planks, 3.0, 0.12, 0.5, 0, 0.26, k, Math.round(k / 0.55) % 2 ? '#b88a5a' : '#a97c4f');
    [-1, 1].forEach(s => {
      B(frame, 0.12, 0.12, 8.0, s * 1.5, 1.05, 0, '#8a5f3e');
      for (let k = -3.6; k <= 3.61; k += 1.2) B(frame, 0.16, 1.0, 0.16, s * 1.5, 0.6, k, '#7a5236');
      [-1, 1].forEach(e => B(frame, 0.34, 1.3, 0.34, s * 1.6, -0.2, e * 3.95, '#6f6a5f'));
    });
    [[planks, { vc: 1, rim: 0.1 }], [frame, { vc: 1 }]].forEach(([list, o]) => { const m = new THREE.Mesh(merge(list), toon('#ffffff', o)); m.castShadow = m.receiveShadow = true; g.add(m); });
  }
  // (the old crop field by the road is the corn maze now: cornmaze.js)
  // signposts: where the forest ends, by the bridge, and on the roads east and west. Big bold names on both faces. The
  // back says where you're headed walking the other way (on the forest road: the station), and its arrow points the same
  // way as the front's (a box's back face isn't mirrored, but «→» read from behind would point the other way)
  // zh / ja (CJK.md): the station and the towns' names in the notation, painted as the mode's plain text (no capitals)
  const STATION = { es: 'Estación', pt: 'Estação', de: 'Bahnhof', zh: '[车站|chē zhàn]', ja: '[駅|えき]' };
  const TOWN_CJ = { ALBA: { zh: '[阿尔巴|Ā ěr bā]', ja: 'アルバ' }, MOLINAR: { zh: '[磨坊镇|Mò fáng zhèn]', ja: 'モリナール' }, REMANSO: { zh: '[静水村|Jìng shuǐ cūn]', ja: 'レマンソ' } };
  const cjkL = l => typeof CJK !== 'undefined' && CJK.isCJK(l);
  const townPost = s => l => (cjkL(l) ? s.replace(/[A-Z]+/, w => CJK.plain(TOWN_CJ[w][l], { lang: l })) : s);
  const postPaint = (cv, tex, text) => {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.fillStyle = '#d6ad7a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a5f3e'; c.lineWidth = 12; c.strokeRect(6, 6, W - 12, H - 12);
    let px = 108; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`;
    while (px > 20 && c.measureText(text).width > W - 56) { px -= 2; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; }
    c.fillStyle = '#4a2e1a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + px * 0.06);
    tex.needsUpdate = true;
  };
  const postFace = text => {        // (text: a string, or l => string for words in the language)
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    if (typeof text !== 'function') postPaint(cv, tex, text);
    else if (typeof SIGNS !== 'undefined') SIGNS.board(l => postPaint(cv, tex, text(l)));
    else postPaint(cv, tex, text('es'));
    return new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad });
  };
  const toStation = l => (cjkL(l) ? CJK.plain(STATION[l], { lang: l }) : (STATION[l] || STATION.es).toUpperCase()) + ' ↑';
  [[-12.6, -38, 0.3, townPost('ALBA ↑'), toStation], [10, -71, -0.4, townPost('ALBA ↑'), toStation], [38, -155.5, -1.45, townPost('MOLINAR →'), townPost('← MOLINAR')], [140, -154.5, -1.6, townPost('MOLINAR →'), townPost('← MOLINAR')],
    [-60, -155.5, 1.45, townPost('← REMANSO'), townPost('REMANSO →')], [-108, -155, 1.6, townPost('← REMANSO'), townPost('REMANSO →')]].forEach(([x, z, rot, front, back], i) => {
    const g = new THREE.Group(); g.position.set(x, WORLD.terrainAt(x, z), z); g.rotation.y = rot; scene.add(g);
    box(g, 0.16, 1.62, 0.16, 0, 0.81, 0, '#7a5236');
    const wood = toon('#c79d6d');
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.08), [wood, wood, wood, wood, postFace(front), postFace(back)]);
    board.position.set(0, 1.9, 0); board.castShadow = true; g.add(board);     // on top of its post (in front of it, the post hid the back's words)
    // (the forest road's posts have a word in the language: E «Read»; the others are just the towns' names)
    if (back === toStation && typeof SIGNS !== 'undefined') SIGNS.add({ id: 'roadpost' + i, x, z, r: 1.9, card: l => ({ tag: 'A signpost by the road', lines: [
      { text: (cjkL(l) ? TOWN_CJ.ALBA[l] : 'Alba') + ' ↑', en: 'to Alba (the town)' }, { text: (STATION[l] || STATION.es) + ' ↑', en: 'to the station (on the back)' }] }) });
  });
  WORLD.addSolids([{ x: -12.6, z: -38, r: 0.2 }, { x: 10, z: -71, r: 0.2 }, { x: 38, z: -155.5, r: 0.2 }, { x: 140, z: -154.5, r: 0.2 }, { x: -60, z: -155.5, r: 0.2 }, { x: -108, z: -155, r: 0.2 }]);
  // the fox's den in its clearing: a mossy mound with a burrow, an old stump, stones (and a log, in WORLD.logs)
  {
    const D = WORLD.den, g = new THREE.Group(); g.position.set(D.x, WORLD.terrainAt(D.x, D.z), D.z); g.rotation.y = 0.9; scene.add(g);
    g.add(part(G.sphere, '#5f7e48', [0, 0, 0], [1.9, 1.15, 1.6], { ink: 0.015 }));
    g.add(part(G.sphere, '#6e8f52', [0.5, 0.55, -0.3], [0.9, 0.6, 0.8], { ink: 0 }));
    const hole = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#2a2230' })); hole.scale.set(0.55, 0.45, 0.3); hole.position.set(0, 0.35, 1.45); g.add(hole);
    [[-0.7, 0.05, 1.5], [0.75, 0.05, 1.45], [0, 0.02, 1.95]].forEach(p => g.add(part(G.ico1, '#9b8a6a', p, [0.28, 0.12, 0.22], { ink: 0 })));
    const st = D.stump, s = new THREE.Group(); s.position.set(st.x, WORLD.terrainAt(st.x, st.z), st.z); scene.add(s);
    s.add(part(new THREE.CylinderGeometry(1.0, 1.25, 1.3, 14), '#8a5f3e', [0, 0.65, 0], null, { ink: 0.02 }));
    s.add(part(new THREE.CylinderGeometry(0.98, 0.98, 0.06, 14), '#d9b27a', [0, 1.31, 0], null, { ink: 0 }));
    [0, 1.6, 3.4, 4.8].forEach(a => s.add(part(G.box, '#7c5436', [Math.cos(a) * 1.2, 0.2, Math.sin(a) * 1.2], [0.9, 0.3, 0.32], { rot: [0, -a, 0.2], ink: 0 })));
    s.add(part(G.sphere, '#5d8f3e', [0.3, 1.36, -0.2], [0.55, 0.12, 0.45], { ink: 0 }));
    D.stones.forEach(([x, z], i) => { const r = new THREE.Mesh(G.ico1, toon('#a3a196', { rim: 0.2 })); r.scale.set(0.5, 0.32, 0.42); r.position.set(x, WORLD.terrainAt(x, z) + 0.1, z); r.rotation.y = i; r.castShadow = true; scene.add(r); });
  }

  // ------------------------------------------------------------ far away: mountains and clouds
  const RM = rng(5);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + RM() * 0.2, d = 330 + RM() * 90 + (Math.cos((i / 18) * TAU) < -0.45 ? 400 : 0), h = 70 + RM() * 70, r = 46 + RM() * 36;     // (the west ones out past the Mirror Lake's far water, in the haze)
    const pieces = [{ geo: new THREE.ConeGeometry(r, h, 7), m: M4(0, h / 2, 0, 1), color: i % 2 ? '#7fa88f' : '#86ae9a' }];
    if (h > 72) pieces.push({ geo: new THREE.ConeGeometry(r * 0.32, h * 0.32, 7), m: M4(0, h * 0.85, 0, 1.02), color: '#f4f8fb' });
    const m = new THREE.Mesh(merge(pieces, true), toon('#ffffff', { vc: 1, rim: 0 }));
    m.position.set((-296 + L.maxX) / 2 + Math.cos(a) * d, 2, (-300 + L.maxZ) / 2 + Math.sin(a) * d); m.rotation.y = RM() * TAU; scene.add(m);     // (round the map as it was before the lake grew west, and the marsh north)
    if (typeof PEAKS !== 'undefined' && PEAKS.farMountain) PEAKS.farMountain(m, r);       // (out past the Frost Peaks: further off, and snowy)
  }
  const clouds = [];
  for (let i = 0; i < 14; i++) {
    const R = rng(i + 40), pieces = [];
    for (let k = 0; k < 6; k++) pieces.push({ geo: G.ico, m: M4((k - 2.5) * 3.4 + R() * 2, R() * 1.5, R() * 3, 2.6 + R() * 2.2, 1.4 + R(), 2.3 + R()), color: k % 2 ? '#ffffff' : '#f4f9fd' });
    const m = new THREE.Mesh(merge(pieces), toon('#ffffff', { vc: 1, rim: 0.2 }));
    m.position.set(-460 + R() * 720, 46 + R() * 18, -300 + R() * 420); scene.add(m); clouds.push(m);       // (over the grown lake too)
  }

  // ------------------------------------------------------------ the Hush: slow gray motes
  const motes = (() => {
    const n = 260, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), seeds = [];
    const R = rng(77);
    for (let i = 0; i < n; i++) { const h = L.hush[i % L.hush.length]; const a = R() * TAU, r = Math.sqrt(R()) * h.r * 0.9; seeds.push({ h, x: h.x + Math.cos(a) * r, z: h.z + Math.sin(a) * r, y: 0.3 + R() * 2.4, ph: R() * 9 }); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#c8c6d8', size: 0.13, transparent: true, opacity: 0.75, depthWrite: false, map: TK.glowTex }));
    pts.frustumCulled = false; scene.add(pts);
    return { pts, seeds, pos, geo };
  })();
  // light shafts in the clearings
  const shafts = [];
  {
    const tex = TK.canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,248,210,0)'); g.addColorStop(0.3, 'rgba(255,248,210,0.5)'); g.addColorStop(1, 'rgba(255,248,210,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 256); });
    L.clearings.filter(c => c.kind !== 'lookout').forEach(c => {
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35, side: THREE.DoubleSide, fog: false }));
        m.position.set(c.x + (i - 1) * 2.2, WORLD.terrainAt(c.x, c.z) + 6, c.z + (i - 1) * 1.1); m.rotation.set(0, i * 1.1, 0.35); scene.add(m); shafts.push(m);
      }
    });
  }

  // everything above (the land, grass, trees, water, the station and the train…): not drawn while you're indoors, where it's
  // far below the room and behind its fog anyway (a house would otherwise pay for the whole outdoors, ~600 draw calls)
  const OUTDOOR = scene.children.filter(o => !o.isLight && o !== sun.target && o !== sky);
  let hidOut = null;
  // ------------------------------------------------------------ per frame
  const fogForest = new THREE.Color('#9fc7b8'), fogHush = new THREE.Color('#b9b8c2'), fogMarsh = new THREE.Color('#aab3a6');
  let hushNow = 0, interior = null, mistNow = 0;
  function update(dt, focus, cam, mimoPos) {
    time.value += dt;
    const t = time.value;
    sun.position.set(focus.x + SUN.x * 70, focus.y + SUN.y * 70, focus.z + SUN.z * 70); sun.target.position.set(focus.x, focus.y, focus.z);
    sky.position.copy(camera.position);
    fadeU.uCamPos.value.copy(camera.position); fadeU.uFocus.value.set(focus.x, focus.y + 1.0, focus.z);
    const f = WORLD.forestAt(focus.x, focus.z), h = WORLD.hushAt(focus.x, focus.z);
    hushNow = damp(hushNow, h, 2, dt);
    scene.fog.color.copy(FOG).lerp(fogForest, f * 0.7).lerp(fogHush, hushNow * 0.8);
    scene.fog.near = lerp(45, 18, f) * (1 - hushNow * 0.4); scene.fog.far = lerp(240, 110, f) * (1 - hushNow * 0.35);
    // (the Gray Marsh's mist, marsh.js: closer and grayer down in its basin; it thins once the marsh is freed)
    if (typeof MARSH !== 'undefined' && MARSH.mistAt) { mistNow = damp(mistNow, MARSH.mistAt(focus.x, focus.z), 1.5, dt); if (mistNow > 0.005) { scene.fog.color.lerp(fogMarsh, mistNow * 0.65); scene.fog.near *= 1 - 0.55 * mistNow; scene.fog.far *= 1 - 0.45 * mistNow; } }
    // indoors (the Great Mill): no sky; past the room's walls everything fades into a warm dark
    sky.visible = !interior;
    if (interior) { scene.fog.color.set(interior.fog); scene.fog.near = interior.near; scene.fog.far = interior.far; scene.background = interior.bg; } else if (scene.background) scene.background = null;
    grass.material.uniforms.uFogNear.value = waterMat.uniforms.uFogNear.value = scene.fog.near;
    grass.material.uniforms.uFogFar.value = waterMat.uniforms.uFogFar.value = scene.fog.far;
    // tree tiles wholly past the fog (drawn all in its color, low against a sky of nearly the same) aren't drawn: across the grown
    // lake you see most of the map, and every tile of it cost a draw call
    if (!interior) { const fr = scene.fog.far + 24, cp = camera.position; for (const im of tilesBuilt) { const s = im.geometry.boundingSphere; im.visible = Math.hypot(s.center.x - cp.x, s.center.z - cp.z) - s.radius < fr; } }
    // the station (its platform is plank by plank: ~90 draw calls) isn't drawn past 175, where the newer regions hide too (from Alba
    // it sat far behind the forest's fog)
    if (!interior) station.visible = Math.hypot(STATION_C.x - camera.position.x, STATION_C.z - camera.position.z) < 175;
    hemi.intensity = lerp(0.5, 0.42, f); sun.intensity = lerp(0.68, 0.56, f) * (1 - hushNow * 0.25);
    sky.material.uniforms.uHush.value = hushNow;
    // (both grass patches sit ahead of where the camera really looks: in a cutscene too, where cam.yaw is still the play camera's)
    camera.getWorldDirection(gDir); let gLen = Math.hypot(gDir.x, gDir.z);
    if (gLen < 0.05) { gDir.set(Math.sin(cam.yaw), 0, Math.cos(cam.yaw)); gLen = 1; }
    grass.material.uniforms.uCenter.value.set(camera.position.x + gDir.x / gLen * 12, camera.position.z + gDir.z / gLen * 12);
    grassFar.material.uniforms.uCenter.value.set(camera.position.x + gDir.x / gLen * 30, camera.position.z + gDir.z / gLen * 30);
    grass.material.uniforms.uPlayer.value.set(focus.x, focus.y, focus.z);
    if (mimoPos) grass.material.uniforms.uMimo.value.copy(mimoPos);
    clouds.forEach(c => { c.position.x += dt * 1.5; if (c.position.x > 260) c.position.x = -460; });
    ringGlow.forEach((g, i) => { g.material.opacity = ring.active ? 0.75 + 0.25 * Math.sin(t * 3 + i) : 0.35 + 0.25 * Math.sin(t * 2 + i); g.scale.setScalar(ring.active ? 1.6 : 1.1); });
    if (ring.active && (ring.cool -= dt) <= 0) {
      ring.cool = 0.35;
      const left = ringGroups.filter(g => g.visible);
      if (left.length) { const g = left[(Math.random() * left.length) | 0]; fx.sparkle(g.position.x, g.position.y + 0.6, g.position.z, 3, ['#9ff5e8', '#fff3a0']); }
    }
    for (let i = waves.length - 1; i >= 0; i--) {
      const w = waves[i]; w.life += dt; const k = w.life / w.max;
      w.m.position.z += w.vz * dt; w.m.position.y -= dt * 0.9;
      w.m.material.opacity = 0.62 * Math.sin(Math.PI * Math.min(1, k)); w.m.scale.set(w.s * 1.4 * (1 + k * 0.6), w.s * (1 + k * 0.6), w.s * (1 + k * 0.6));
      if (k >= 1) { scene.remove(w.m); w.m.material.dispose(); waves.splice(i, 1); }
    }
    shafts.forEach((s, i) => { s.material.opacity = 0.22 + 0.1 * Math.sin(t * 0.5 + i); });
    for (let i = 0; i < motes.seeds.length; i++) {
      const s = motes.seeds[i];
      motes.pos[i * 3] = s.x + Math.sin(t * 0.21 + s.ph) * 0.8; motes.pos[i * 3 + 1] = s.h.a > 0.05 ? WORLD.terrainAt(s.x, s.z) + s.y + Math.sin(t * 0.33 + s.ph * 2) * 0.4 : -50; motes.pos[i * 3 + 2] = s.z + Math.cos(t * 0.17 + s.ph) * 0.8;
    }
    liftStep(dt);
    motes.geo.attributes.position.needsUpdate = true;
    // the train: idles with steam, leaves when told (off along the line and into the tunnel), and now and
    // then comes back while you're around the station
    const TS = trainState;
    if (TS.mode === 'leaving') {
      TS.v = Math.min(TS.v + dt * 2.2, 14); TS.s += TS.v * dt;
      if (TS.s - 7.8 > TR.sPortal + 1.4) { TS.mode = 'gone'; TS.gone = 150 + Math.random() * 120; TS.v = 0; train.visible = false; }
    } else if (TS.mode === 'gone') {
      TS.gone -= dt;
      if (TS.gone <= 0 && focus.z > 36 && Math.abs(focus.x) < 45) { TS.mode = 'coming'; TS.s = TR.sPortal + 12; train.visible = true; trainSfx('whistle'); }
    } else if (TS.mode === 'coming') {
      TS.v = -Math.max(0.9, Math.min(9, Math.sqrt(2 * 1.4 * Math.max(0, TS.s - TR.sStop))));
      TS.s += TS.v * dt;
      if (TS.s <= TR.sStop) { TS.s = TR.sStop; TS.v = 0; TS.mode = 'here'; TS.wait = 40; }
    } else if (TS.wait > 0 && (TS.wait -= dt) <= 0) { TS.mode = 'leaving'; TS.v = 0.5; trainSfx('whistle'); }
    if (train.visible) {
      placeTrain();
      TS.steam -= dt;
      if (TS.steam <= 0 && TS.s < TR.sPortal - 1) { const a = TR.at(TS.s + 1.8); TS.steam = TS.v ? 0.12 : 0.6; fx.puff(a.x, 3.9, a.z, 1, 0.45, '#f4f4f4', 1.6); }
      if (TS.v) {      // the wheels clacking over the rail joints, when you're near enough to hear
        TS.clack += Math.abs(TS.v) * dt;
        if (TS.clack > 2.5) { TS.clack = 0; if (Math.hypot(loco.position.x - focus.x, loco.position.z - focus.z) < 45) trainSfx('chug'); }
      }
    }
    fx.update(dt);
  }
  return {
    scene, camera, fx, update, drawSign, mapTex, time,
    get hush() { return hushNow; },
    grassTint: grass.material.uniforms.uTint.value,      // (a THREE.Color the grass's colors are multiplied by: past.js sets it, and puts it back to white)
    // indoors: setInterior({ fog: '#2a1f1a', near: 16, far: 46 }) / setInterior(null)
    setInterior(o) {
      interior = o ? { fog: o.fog || '#2a1f1a', near: o.near || 16, far: o.far || 46, bg: new THREE.Color(o.fog || '#2a1f1a') } : null;
      // (each thing's own visibility comes back as it was: the train stays gone, a picked mushroom ring stays hidden)
      // (and the interlude's old tower on the horizon: added later, and fog-free, it peeked in below the floating rooms)
      if (o && !hidOut) { const late = scene.children.filter(m => m.name === 'old-tower' && !OUTDOOR.includes(m)); hidOut = OUTDOOR.concat(late).map(m => [m, m.visible]); hidOut.forEach(([m]) => { m.visible = false; }); }
      else if (!o && hidOut) { hidOut.forEach(([m, v]) => { m.visible = v; }); hidOut = null; train.visible = trainState.mode !== 'gone'; }
    },
    train: {
      departs() { const T = trainState; if (T.mode === 'here') { T.mode = 'leaving'; T.v = 0.5; T.wait = 0; } },
      gone(sec) { const T = trainState; T.mode = 'gone'; T.v = 0; T.gone = sec !== undefined ? sec : 60 + Math.random() * 60; train.visible = false; },   // (loading a save)
      get x() { return loco.position.x; }, get z() { return loco.position.z; },
      get car() { return car.position; },
      get here() { return train.visible && trainState.mode === 'here'; },
      get mode() { return trainState.mode; },
      // (for the camera's spring arm: the loco and the car as boxes, when the train's out)
      blockers() {
        if (!train.visible) return [];
        return [[loco, 2.4], [car, 2.8]].map(([p, hw]) => ({ x: p.position.x, z: p.position.z, hw: hw, hd: 1.45, c: Math.cos(p.rotation.y), s: Math.sin(p.rotation.y), y0: -0.5, h: 4.4, r: hw + 1.5 }));
      },
    },
    liftHush(i, instant) { if (!L.hush[i]) return; lifting.add(i); if (instant) { L.hush[i].a = 0.0001; liftOne(i, 1); } },
    hideShroom(s) { if (!s._im) return; s._im.setMatrixAt(s._i, new THREE.Matrix4().makeScale(0, 0, 0)); s._im.instanceMatrix.needsUpdate = true; },
    hideRing(i) { if (ringGroups[i]) ringGroups[i].visible = false; },
    ring, hushWave,
  };
}
