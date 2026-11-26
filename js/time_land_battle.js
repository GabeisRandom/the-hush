'use strict';
// Fights in another world's own land (TIME.land, time_land.js; DESIGN.md 21.1): arenas through stage.js's _.arenaBuilders, as
// port_battle.js's harbor does it. A fight there that names no biome takes its land's (TIME.fight asks TIME.land.arena()).
//   'dust'   Molinar tomorrow: cracked earth, dust drifts, dead trees, a stopped windmill on a hill, tumbleweeds, a hazy sky
//   'dunes'  the Bloom Gardens tomorrow: sand dunes, thorn bushes, dead stalks, the greenhouse's dome far off in the haze
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || typeof THREE === 'undefined' || typeof TK === 'undefined') return;
  const _ = BATTLE._;
  const { merge, M4, toon, glowTex } = TK, GG = TK.G;
  // the ground's material: vertex colors, with the Hush's stain under the foes (stage.js's own patch)
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
  function base(K, P, key) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(P.fog, K.FOG_NEAR, K.FOG_FAR); scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(8, 17, 8); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    if (K.makeSky) scene.add(K.makeSky(P));
    return { scene, uni, sun };
  }
  // a crack pattern laid over the middle of the ground: one picture of irregular plates (about a step across), fading out at its rim
  function crackTex(col) {
    return TK.canvasTex(1024, 1024, (c, w, h) => {
      const R = rng(4242), N = 26, P = [], cs = w / N;
      c.clearRect(0, 0, w, h);
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) P.push([i * cs + (i % N ? (R() - 0.5) * cs * 0.7 : 0), j * cs + (j % N ? (R() - 0.5) * cs * 0.7 : 0)]);
      c.strokeStyle = col; c.lineJoin = 'round';
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = P[j * (N + 1) + i], b = P[j * (N + 1) + i + 1], d = P[(j + 1) * (N + 1) + i + 1], e = P[(j + 1) * (N + 1) + i];
        c.lineWidth = 2 + R() * 2.5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.stroke();
        if (R() < 0.35) { c.lineWidth = 1.5; c.beginPath(); c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); c.lineTo((e[0] + d[0]) / 2 + (R() - 0.5) * cs * 0.4, (e[1] + d[1]) / 2); c.stroke(); }
      }
      // (fade out toward the rim, so there's no edge where the cracks stop)
      c.globalCompositeOperation = 'destination-in';
      const g = c.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
  }
  const deadTree = (pcs, x, y, z, s, R, col = '#6b6159') => {
    const rodP = (ax, ay, az, len, r, ang, tilt) => { const dx = -Math.sin(tilt) * Math.cos(ang), dy = Math.cos(tilt), dz = Math.sin(tilt) * Math.sin(ang); pcs.push({ geo: new THREE.CylinderGeometry(r * 0.55, r, len, 6), m: M4(ax + dx * len / 2, ay + dy * len / 2, az + dz * len / 2, 1, 1, 1, ang, 0, tilt), color: col }); return [ax + dx * len, ay + dy * len, az + dz * len]; };
    rodP(x, y, z, 2.6 * s, 0.24 * s, 0, 0.05);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + R() * 0.5, e = rodP(x, y + (1.4 + i * 0.25) * s, z, (1.2 + R() * 0.5) * s, 0.08 * s, a, 0.6 + R() * 0.4); rodP(e[0], e[1], e[2], 0.6 * s, 0.035 * s, a + 0.6, 0.4 + R() * 0.4); }
  };

  // ================================================================ 'dust': Molinar tomorrow, the dust bowl
  function buildDust(K) {
    const P = { fog: '#e2d1b0', skyTop: [0.5, 0.58, 0.7], skyHor: [0.93, 0.85, 0.7], hemiSky: '#fff2dc', hemiGround: '#8a6e4a', sun: '#fff0d0', hemiI: 0.62, sunI: 0.68 };
    const { scene, uni, sun } = base(K, P, 'dust');
    const R = rng(8181), c = new THREE.Color(), A = new THREE.Color('#c7ad7e'), B = new THREE.Color('#b39669'), D = new THREE.Color('#a48a60');
    const geo = new THREE.PlaneGeometry(110, 110, 120, 120); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      p.setY(i, K.groundH(x, z) * 0.6);
      c.copy(A).lerp(B, 0.5 + 0.5 * Math.sin(x * 0.42 + Math.cos(z * 0.33) * 2)).lerp(D, 0.35 * ss01(Math.sin(x * 0.13 - z * 0.2) * Math.cos(z * 0.17)));
      c.multiplyScalar(0.95 + 0.05 * Math.sin(r * 1.7));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, stainMat(uni, 'dust-floor')); floor.receiveShadow = true; scene.add(floor);
    // the cracks over the middle, where the fight is (flat there)
    const cr = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: crackTex('rgba(92,68,42,0.62)'), transparent: true, depthWrite: false, fog: true }));
    cr.position.y = 0.02; cr.renderOrder = 1; scene.add(cr);
    const pcs = [];
    // dead trees and stumps behind the fight (never between the camera and the stage)
    for (let n = 0, tries = 0; n < 16 && tries < 2000; tries++) {
      const a = R() * TAU, r = 12 + R() * 24, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > -3 || (z > -9 && Math.abs(x) < 12)) continue;
      const y = K.groundH(x, z) * 0.6 - 0.1;
      if (R() < 0.7) deadTree(pcs, x, y, z, 0.9 + R() * 0.5, R); else pcs.push({ geo: new THREE.CylinderGeometry(0.32, 0.4, 0.5, 9), m: M4(x, y + 0.25, z, 1), color: '#7a6046' });
      n++;
    }
    // dust drifts round the edges, dry tufts, a fence half buried
    for (let i = 0; i < 14; i++) { const a = R() * TAU, r = 9 + R() * 18, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > -2 && Math.abs(x) < 13) continue; pcs.push({ geo: GG.sphere, m: M4(x, K.groundH(x, z) * 0.6 - 0.1, z, 2.2 + R() * 2.2, 0.5 + R() * 0.5, 1.4 + R() * 1.2, R() * 3), color: i % 2 ? '#d3bf96' : '#c9b48a' }); }
    for (let i = 0; i < 60; i++) { const a = R() * TAU, r = 5 + R() * 20, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 1 && Math.abs(x) < 10) continue; for (let j = 0; j < 4; j++) pcs.push({ geo: new THREE.ConeGeometry(0.03, 0.35 + R() * 0.25, 4), m: M4(x + Math.cos(j * 1.6) * 0.1, 0.16, z + Math.sin(j * 1.6) * 0.1, 1, 1, 1, 0, Math.cos(j) * 0.3, Math.sin(j) * 0.3), color: j % 2 ? '#d9c68c' : '#c4ae76' }); }
    for (let i = 0; i < 7; i++) { const x = -9 + i * 1.3, z = -8.5 - Math.sin(i) * 0.3; pcs.push({ geo: GG.box, m: M4(x, 0.35, z, 0.1, 0.7, 0.1), color: '#8a7458' }, { geo: GG.box, m: M4(x + 0.65, 0.45, z, 1.3, 0.07, 0.05), color: '#9a846a' }); }
    // a stopped windmill on a hill, far off
    { const x = 26, z = -44, y = 5; pcs.push({ geo: GG.sphere, m: M4(x, -2, z, 16, 8, 14), color: '#b9a37a' }, { geo: new THREE.CylinderGeometry(1.6, 2.2, 7, 12), m: M4(x, y + 3.5, z, 1), color: '#d8d0c0' }, { geo: new THREE.ConeGeometry(2.0, 2.0, 12), m: M4(x, y + 8, z, 1), color: '#8a6a52' });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.3; pcs.push({ geo: GG.box, m: M4(x + Math.cos(a) * 3.2, y + 6.5 + Math.sin(a) * 3.2, z + 2.2, 0.5, 6, 0.12, 0, 0, a - Math.PI / 2), color: '#a89a86' }); } }
    // far hills, dusty
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, d = 110 + R() * 30, h = 18 + R() * 20, r = 30 + R() * 20; pcs.push({ geo: new THREE.ConeGeometry(r, h, 7), m: M4(Math.cos(a) * d, -4 + h / 2, Math.sin(a) * d, 1, 1, 1, R() * 3), color: i % 2 ? '#c2ab82' : '#b59d74' }); }
    const props = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.12 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    // tumbleweeds rolling across, and dust in the air
    const tw = [], tg = merge([{ geo: GG.ico1, m: M4(0, 0, 0, 0.42), color: '#a8885a' }, { geo: GG.ico0, m: M4(0, 0, 0, 0.5, 0.46, 0.5, 0.6, 0.4), color: '#8a6e48' }]);
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(tg, toon('#ffffff', { vc: 1, rim: 0.1 })); m.castShadow = true; scene.add(m); tw.push({ m, x: -30 + i * 20, z: -6 - i * 5, sp: 2.4 + i * 0.8, ph: i * 2 }); }
    const motes = [];
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#f3e2c0', transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.22); scene.add(s); motes.push({ s, x: -12 + R() * 24, z: -9 + R() * 12, y: 0.3 + R() * 3, ph: R() * TAU, sp: 0.6 + R() * 0.6 }); }
    function update(t, dt) {
      uni.uTime.value = t;
      for (const w of tw) { w.x += w.sp * dt; if (w.x > 32) w.x = -32; w.m.position.set(w.x, 0.45 + Math.abs(Math.sin(t * 3 + w.ph)) * 0.35, w.z); w.m.rotation.z -= w.sp * dt * 2.2; }
      for (const m of motes) { m.s.position.set(((m.x + t * m.sp * 2.5 + 16) % 32) - 16, m.y + Math.sin(t * 1.7 + m.ph) * 0.2, m.z); m.s.material.opacity = 0.22 + 0.12 * Math.sin(t * 1.3 + m.ph); }
    }
    return { scene, sun, uni, update, P, dust: true };
  }
  const ss01 = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

  // ================================================================ 'dunes': the Bloom Gardens tomorrow, the thorny desert
  function buildDunes(K) {
    const P = { fog: '#ecd9b2', skyTop: [0.4, 0.6, 0.86], skyHor: [0.97, 0.88, 0.72], hemiSky: '#fff6e2', hemiGround: '#a07a4a', sun: '#fff2d2', hemiI: 0.62, sunI: 0.74 };
    const { scene, uni, sun } = base(K, P, 'dunes');
    const R = rng(9191), c = new THREE.Color(), A = new THREE.Color('#e2c890'), B = new THREE.Color('#d1b27a');
    // the floor: sand in ripples, rising into dunes past the fight
    const duneH = (x, z) => { const r = Math.hypot(x, z); return ss01((r - 10) / 14) * (2.2 + 1.6 * Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09)) + Math.sin(x * 0.3 + z * 0.12) * 0.18 * ss01((r - 6) / 10); };
    const geo = new THREE.PlaneGeometry(110, 110, 130, 130); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, K.groundH(x, z) * 0.35 + duneH(x, z));
      c.copy(A).lerp(B, 0.5 + 0.5 * Math.sin(x * 1.25 + Math.sin(z * 0.5) * 2.4)).multiplyScalar(0.94 + 0.08 * ss01((duneH(x, z) - 0.5) / 2));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, stainMat(uni, 'dunes-floor')); floor.receiveShadow = true; scene.add(floor);
    const pcs = [];
    // thorny scrub, cacti and dead stalks behind and beside the fight (never between the camera and the stage)
    for (let n = 0, tries = 0; n < 26 && tries < 3000; tries++) {
      const a = R() * TAU, r = 8 + R() * 22, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (z > -2.5 && Math.abs(x) < 12) continue;
      const y = K.groundH(x, z) * 0.35 + duneH(x, z) - 0.05, kind = R();
      if (kind < 0.45) { pcs.push({ geo: GG.ico1, m: M4(x, y + 0.4, z, 0.55, 0.42, 0.55), color: '#4f463a' }); for (let i = 0; i < 9; i++) { const aa = i / 9 * TAU, t = 0.7 + R() * 0.7, l = 0.8 + R() * 0.5; pcs.push({ geo: new THREE.ConeGeometry(0.05, l, 4), m: M4(x + Math.cos(aa) * Math.sin(t) * l / 2, y + 0.35 + Math.cos(t) * l / 2, z + Math.sin(aa) * Math.sin(t) * l / 2, 1, 1, 1, aa, 0, -t), color: i % 2 ? '#5a5044' : '#6e6455' }); } }
      else if (kind < 0.8) { const h = 1.6 + R() * 1.2; pcs.push({ geo: new THREE.CylinderGeometry(0.26, 0.3, h, 9), m: M4(x, y + h / 2, z, 1), color: '#5f8f4a' }, { geo: GG.ico1, m: M4(x, y + h, z, 0.26, 0.2, 0.26), color: '#6a9a52' }, { geo: new THREE.CylinderGeometry(0.15, 0.16, 0.7, 7), m: M4(x + 0.55, y + h * 0.62, z, 1), color: '#5f8f4a' }, { geo: new THREE.CylinderGeometry(0.15, 0.17, 0.55, 7), m: M4(x + 0.32, y + h * 0.45, z, 1, 1, 1, 0, 0, 1.57), color: '#5a8846' }); }
      else for (let i = 0; i < 5; i++) pcs.push({ geo: new THREE.ConeGeometry(0.03, 1.1 + R() * 0.6, 4), m: M4(x + (R() - 0.5) * 0.6, y + 0.55, z + (R() - 0.5) * 0.6, 1, 1, 1, 0, (R() - 0.5) * 0.4, (R() - 0.5) * 0.4), color: '#a89878' });
      n++;
    }
    // the greenhouse, far off in the haze, half buried
    { const x = -6, z = -46, y = K.groundH(x, z) * 0.35 + duneH(x, z) - 1.2; pcs.push({ geo: GG.box, m: M4(x, y + 2, z, 13, 4, 8), color: '#e9eef0' }, { geo: new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), m: M4(x, y + 4, z, 4.5, 3.6, 4.5), color: '#dfe8ec' }, { geo: GG.sphere, m: M4(x + 7, y, z + 2, 6, 2.6, 4), color: '#e2c890' }); }
    // dead trees far off
    for (let i = 0; i < 6; i++) { const a = -2.4 + i * 0.32, r = 26 + R() * 10, x = Math.cos(a) * r, z = Math.sin(a) * r; deadTree(pcs, x, K.groundH(x, z) * 0.35 + duneH(x, z) - 0.1, z, 1 + R() * 0.4, R, '#7a6e62'); }
    const props = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.14 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    // sand blowing across
    const motes = [];
    for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#fff0cc', transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.16 + R() * 0.1); scene.add(s); motes.push({ s, x: -12 + R() * 24, z: -9 + R() * 12, y: 0.2 + R() * 2.4, ph: R() * TAU, sp: 0.8 + R() * 0.8 }); }
    function update(t, dt) {
      uni.uTime.value = t;
      for (const m of motes) { m.s.position.set(((m.x + t * m.sp * 3.2 + 16) % 32) - 16, m.y + Math.sin(t * 2.1 + m.ph) * 0.15, m.z); m.s.material.opacity = 0.25 + 0.15 * Math.sin(t * 1.6 + m.ph); }
    }
    return { scene, sun, uni, update, P, dunes: true };
  }

  _.arenaBuilders = _.arenaBuilders || {};
  if (!_.arenaBuilders.dust) _.arenaBuilders.dust = K => buildDust(K);
  if (!_.arenaBuilders.dunes) _.arenaBuilders.dunes = K => buildDunes(K);

  // Port Brisa tomorrow (the sea risen: TIME.land's port future): port_battle.js's harbor, its water raised up the pier's legs, the
  // buoys and the foam with it (half as much once the world is freed). Wrapped, not edited: today and long ago build it as before.
  const harbor0 = _.arenaBuilders.harbor;
  if (harbor0 && !harbor0.tfFlood) {
    const raised = () => { const c = TIME.land && TIME.land._ && TIME.land._.cur; return !c || c.rid !== 'port' || c.w !== 'future' ? 0 : c.healed ? 0.2 : 0.42; };
    const flooded = K => {
      const A = harbor0(K), D = raised(); if (!D || !A || !A.scene) return A;
      const WY = (_.harbor && _.harbor.WATER_Y) || -0.55, floats = [];
      for (const o of A.scene.children) {
        if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && o.material && o.material.isShaderMaterial && Math.abs(o.position.y - WY) < 0.01) o.position.y += D;      // (the sea)
        else if (o.isInstancedMesh) o.position.y += D;            // (the foam rings)
        else if (o.isMesh && o.castShadow && Math.abs(o.position.y - WY) < 0.01) floats.push(o);       // (the buoys: their own update sets them each frame)
        else if (o.isSprite && o.material && o.material.color && o.material.color.getHexString() === 'b8ffcf') floats.push(o);       // (the can buoy's light)
      }
      const up0 = A.update;
      A.update = function (t, dt, sc) { const r = up0.call(this, t, dt, sc); for (const o of floats) o.position.y += D; return r; };
      return A;
    };
    flooded.tfFlood = true;
    _.arenaBuilders.harbor = flooded;
  }
})();
