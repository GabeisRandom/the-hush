'use strict';
// Interludes: short cutaways between story beats (like Bowser's scenes between chapters in Paper
// Mario) that show who is behind the Hush without saying who it is: a small hooded figure in the top
// room of the old tower in the north. A beat is a few shots under letterboxed captions. It draws its
// own scenes with the shared renderer, the same way the battles do:
//   const p = INTERLUDE.play({ renderer, beat: 'open' | 'end' | 'journey', captions, onPause });   // resolves when it ends or is skipped
//   every frame: INTERLUDE.update(dt, Input.read()); INTERLUDE.render();
// E jumps to the next caption or shot, Esc skips the beat. A beat ends on black (render() keeps
// drawing black after that). INTERLUDE.buildTower(o) is the old tower on its crag, for the skyline.
// 'journey' is the trip north: your home station, the train compartment, the egg in its basket.
// Halfway it stops for the game: onPause('letters') (async) is awaited while the shot keeps moving
// and the bars, caption and hints are hidden; keys are ignored then. Esc before the pause jumps to
// it (the letters always show); Esc after it ends the beat. INTERLUDE.beats lists the beats.

const INTERLUDE = (() => {
  const { toon, part, G, merge, M4, glowTex, canvasTex } = TK;
  const INK = '#2b2235';
  const v3 = new THREE.Vector3(), v3b = new THREE.Vector3(), v2 = new THREE.Vector2();
  const ease = t => easeInOut(clamp(t, 0, 1));
  const span = (t, a, b) => ease((t - a) / (b - a));
  const isSound = () => typeof Sound !== 'undefined' && Sound && Sound.play;
  const sfx = name => { try { if (isSound()) Sound.play(name); } catch (e) { /* no audio */ } };

  // The toon look on a material of our own (a texture, or fog switched off): TK's cel ramp and rim light.
  function tmat(color, o = {}) {
    const ref = toon('#ffffff', { rim: o.rim });
    const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: TK.grad, map: o.map || null, vertexColors: !!o.vc,
      emissive: new THREE.Color(o.emissive || '#000000'), side: o.side || THREE.FrontSide, transparent: !!o.opacity, opacity: o.opacity || 1 });
    m.onBeforeCompile = ref.onBeforeCompile; m.customProgramCacheKey = ref.customProgramCacheKey;
    m.fog = o.fog !== false;
    return m;
  }
  // ink hulls whose fog can be switched off (TK's are shared by the whole game)
  const inks = {};
  function inkMat(w, fog = true) {
    const k = w + '|' + fog; if (inks[k]) return inks[k];
    const base = TK.outlineMat(w), m = base.clone();
    m.onBeforeCompile = base.onBeforeCompile; m.customProgramCacheKey = base.customProgramCacheKey; m.fog = fog;
    return (inks[k] = m);
  }
  // merged faceted pieces with one closed outline: each hull piece pushes out from its own center
  const radials = new Map();
  const radial = geo => {
    if (radials.has(geo)) return radials.get(geo);
    const g = geo.index ? geo.toNonIndexed() : geo.clone(), p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i).normalize(); n.setXYZ(i, v3.x, v3.y, v3.z); }
    radials.set(geo, g); return g;
  };
  function inked(pieces, mat, ink, fog = true) {
    const geo = merge(pieces); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true;
    if (ink) { const h = new THREE.Mesh(merge(pieces.map(p => ({ geo: radial(p.geo), m: p.m, color: INK }))), inkMat(ink, fog)); h.castShadow = false; m.add(h); }
    return m;
  }
  // an arch: a rectangle with a round top (x centered, y from 0 to h)
  function archShape(w, h, hole) {
    const s = new THREE.Shape(), r = w / 2;
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0);
    if (hole) s.holes.push(hole);
    return s;
  }
  const archPath = (w, h, dx = 0, dy = 0) => { const p = new THREE.Path(), r = w / 2; p.moveTo(-r + dx, dy); p.lineTo(-r + dx, dy + h - r); p.absarc(dx, dy + h - r, r, Math.PI, 0, true); p.lineTo(r + dx, dy); p.lineTo(-r + dx, dy); return p; };
  // soft round puff with a crisp-ish edge (cartoon mist)
  const puffTex = canvasTex(64, 64, c => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 31);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.62, 'rgba(255,255,255,0.8)'); g.addColorStop(0.86, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  // a window of moonlight: pale arch, mullion cross, and a tiny hooded silhouette sitting by it
  function windowTex(figure) {
    return canvasTex(128, 192, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#eaf4ff'); g.addColorStop(1, '#a9cdf6');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2a2440'; c.fillRect(w / 2 - 5, 0, 10, h); c.fillRect(0, h * 0.46, w, 9);
      if (figure) {
        c.fillStyle = '#2a2440'; c.beginPath(); c.moveTo(78, h); c.quadraticCurveTo(80, h - 48, 92, h - 58); c.quadraticCurveTo(100, h - 76, 108, h - 60);
        c.quadraticCurveTo(116, h - 50, 116, h); c.closePath(); c.fill();
        c.beginPath(); c.arc(100, h - 64, 13, 0, TAU); c.fill(); c.beginPath(); c.moveTo(96, h - 76); c.quadraticCurveTo(86, h - 92, 78, h - 82); c.lineTo(94, h - 70); c.fill();
      }
    });
  }

  // ------------------------------------------------------------ the old tower on its crag (base at y = 0, about 31 tall)
  // o: { fog (default false: it reads from far away), haze (0..1, default 0.3, baked toward hazeColor), hazeColor, ink (hull width, 0 = none), cloud, seed }
  function buildTower(o = {}) {
    const fog = !!o.fog, haze = o.haze === undefined ? 0.3 : o.haze, ink = o.ink === undefined ? 0.08 : o.ink;
    const HZ = new THREE.Color(o.hazeColor || '#c3e4ef'), R = rng(o.seed || 7);
    const C = c => new THREE.Color(c).lerp(HZ, haze);
    const mats = {};
    const mat = (c, x = {}) => { const k = c + '|' + (x.rim === undefined ? '' : x.rim) + '|' + (x.vc ? 1 : 0); return mats[k] || (mats[k] = tmat(x.vc ? '#ffffff' : C(c), Object.assign({ fog }, x))); };
    const g = new THREE.Group(); g.name = 'old-tower';
    const HALF = Math.PI / 12, SEG = 12;
    const add = (parent, geo, color, pos, x = {}) => {
      const m = part(geo, null, pos, null, Object.assign({}, x, { mat: mat(color, x), ink: 0 }));
      if (ink && x.ink !== 0) { const h = new THREE.Mesh(geo, inkMat(x.ink || ink, fog)); h.castShadow = false; m.add(h); }
      m.receiveShadow = true; parent.add(m); return m;
    };
    // the crag: a heap of big faceted rocks
    const rock = new THREE.DodecahedronGeometry(1, 0), RC = ['#6f6879', '#7b7486', '#655f72', '#857f90'], pcs = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + R() * 0.3, r = 5.4 + R() * 1.3, s = 2.3 + R() * 1.2; pcs.push({ geo: rock, m: M4(Math.cos(a) * r, s * 0.42, Math.sin(a) * r, s * 1.15, s * 0.78, s, R() * 6, R() * 0.6, R() * 0.6), color: RC[i % 4] }); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4 + R() * 0.3, r = 3.3 + R() * 0.7, s = 2.1 + R() * 0.8; pcs.push({ geo: rock, m: M4(Math.cos(a) * r, 2.3 + s * 0.4, Math.sin(a) * r, s, s * 0.85, s * 1.1, R() * 6, R() * 0.6, R() * 0.6), color: RC[(i + 1) % 4] }); }
    pcs.push({ geo: rock, m: M4(0, 2.7, 0, 4.3, 2.5, 4.3, 0.3), color: RC[2] });
    for (let i = 0; i < 9; i++) { const a = R() * TAU, r = 7.4 + R() * 2.2, s = 0.5 + R() * 0.8; pcs.push({ geo: rock, m: M4(Math.cos(a) * r, s * 0.3, Math.sin(a) * r, s * 1.2, s * 0.7, s, R() * 6), color: RC[i % 4] }); }
    pcs.forEach(p => { p.color = C(p.color); });
    g.add(inked(pcs, mat('#ffffff', { vc: true, rim: 0.15 }), ink, fog));
    // the tower: plinth, a tapering shaft with bands, a corbel, the top room, the roof
    const body = new THREE.Group(); body.rotation.y = HALF; g.add(body);   // a flat face (not an edge) looks south
    const cyl = (r1, r2, h) => new THREE.CylinderGeometry(r1, r2, h, SEG);
    add(body, cyl(3.5, 3.8, 1.4), '#7f7a8f', [0, 4.9, 0]);
    add(body, cyl(2.55, 3.05, 15.6), '#8f8a9e', [0, 13.4, 0]);
    [9.4, 14.6, 18.9].forEach(y => { const r = lerp(3.05, 2.55, (y - 5.6) / 15.6) + 0.12; add(body, cyl(r, r, 0.36), '#77728a', [0, y, 0], { ink: ink * 0.6 }); });
    add(body, cyl(3.25, 2.6, 1.0), '#7a7590', [0, 21.7, 0]);
    add(body, cyl(3.15, 3.15, 4.2), '#958fa6', [0, 24.3, 0]);
    add(body, cyl(3.6, 3.6, 0.36), '#5e5873', [0, 26.55, 0]);
    const roof = new THREE.Group(); roof.position.y = 26.7; roof.rotation.set(0.03, 0, -0.05); g.add(roof);
    add(roof, new THREE.ConeGeometry(3.75, 4.7, SEG), '#4d4763', [0, 2.35, 0], { rot: [0, HALF, 0] });
    add(roof, new THREE.SphereGeometry(0.3, 10, 8), '#4d4763', [0, 4.8, 0]);
    // little stones sticking out of the walls, slit windows, the door
    const stones = [], box = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 16; i++) {
      const y = 6.5 + R() * 14, a = R() * TAU, r = lerp(3.05, 2.55, (y - 5.6) / 15.6) * 0.97;
      stones.push({ geo: box, m: M4(Math.sin(a) * r, y, Math.cos(a) * r, 0.6 + R() * 0.5, 0.3 + R() * 0.16, 0.3, a), color: C(R() < 0.5 ? '#a39db2' : '#7c768e') });
    }
    g.add(inked(stones, mat('#ffffff', { vc: true, rim: 0.2 }), ink * 0.5, fog));
    [[10.5, 0.6], [15.6, -0.9], [18.2, 2.6], [12.4, 3.6]].forEach(([y, a]) => {
      const r = lerp(3.05, 2.55, (y - 5.6) / 15.6) * 0.97, m = new THREE.Mesh(new THREE.ShapeGeometry(archShape(0.38, 1.1)), tmat('#1d1828', { rim: 0, fog }));
      m.position.set(Math.sin(a) * (r + 0.02), y, Math.cos(a) * (r + 0.02)); m.rotation.y = a; g.add(m);
    });
    {
      const r = 3.05 * Math.cos(HALF) + 0.04, d = new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.3, 2.1)), tmat(C('#4a3428'), { rim: 0, fog }));
      d.position.set(0, 5.6, r); g.add(d);
      add(g, new THREE.ExtrudeGeometry(archShape(1.8, 2.45, archPath(1.3, 2.1, 0, 0.02)), { depth: 0.3, bevelEnabled: false, curveSegments: 10 }), '#a8a2b8', [0, 5.6, r - 0.16], { ink: ink * 0.5 });
    }
    // the one window, high up, glowing faintly and cold
    const winR = 3.15 * Math.cos(HALF), win = new THREE.Group(); win.position.set(0, 22.9, winR); g.add(win);
    const pane = new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.3, 2.3)), new THREE.MeshBasicMaterial({ map: windowTex(true), fog }));
    pane.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 ? v / 2.3 : v / 1.3 + 0.5; });
    pane.position.z = 0.03; win.add(pane);
    add(win, new THREE.ExtrudeGeometry(archShape(1.85, 2.65, archPath(1.3, 2.3, 0, 0.12)), { depth: 0.32, bevelEnabled: false, curveSegments: 10 }), '#aaa4ba', [0, -0.12, -0.18], { ink: ink * 0.5 });
    add(win, new THREE.BoxGeometry(2.1, 0.22, 0.6), '#aaa4ba', [0, -0.12, 0.12], { ink: ink * 0.5 });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#9cc6ff', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog }));
    glow.position.set(0, 1.2, 0.9); glow.scale.setScalar(6.5); win.add(glow);
    // the Hush: a slow ring of gray cloud around the top, and a smaller one turning the other way
    const puffs = [];
    const cloud = new THREE.Group(), inner = new THREE.Group(); cloud.position.y = 26.4; inner.position.y = 28.3; g.add(cloud, inner);
    if (o.cloud !== false) {
      const pg = new THREE.IcosahedronGeometry(1, 1), CC = ['#93909f', '#86839a', '#a09dae'];
      const puff = (grp, a, r, y, s, i) => {
        const m = part(pg, null, [Math.cos(a) * r, y, Math.sin(a) * r], [s * 1.25, s * 0.9, s], { mat: mat(CC[i % 3], { rim: 0.45 }), ink: 0 });
        if (ink) m.add(new THREE.Mesh(pg, inkMat(0.06, fog)));
        m.castShadow = false; grp.add(m); puffs.push({ m, y, s, ph: R() * TAU });
      };
      for (let i = 0; i < 22; i++) { if (i % 7 === 6) continue; const a = i / 22 * TAU + R() * 0.15; puff(cloud, a, 4.15 + (i % 3) * 0.35, Math.sin(a * 2 + 1) * 0.55 + (i % 2) * 0.4, 0.72 + R() * 0.45, i); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + R() * 0.3; puff(inner, a, 3.0 + R() * 0.4, Math.sin(a * 3) * 0.35, 0.45 + R() * 0.3, i + 1); }
      // soft mist between the puffs, so up close it reads as cloud, not stones
      const mistM = new THREE.SpriteMaterial({ map: puffTex, color: C('#8d8a9e'), transparent: true, opacity: 0.34, depthWrite: false, fog });
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2, s = new THREE.Sprite(mistM); s.position.set(Math.cos(a) * 4.5, (i % 2) * 0.6 - 0.1, Math.sin(a) * 4.5); s.scale.setScalar(2.6 + R() * 1.2); cloud.add(s); }
    }
    g.userData = {
      height: 31.8, window: win, glow,
      crag: pcs.map(p => p.m),         // (each crag rock: a unit dodecahedron under this matrix, in the group's space; main.js keeps the camera out)
      animate(t) {
        cloud.rotation.y = t * 0.11; inner.rotation.y = -t * 0.17;
        puffs.forEach(p => { const k = 1 + Math.sin(t * 0.7 + p.ph) * 0.09; p.m.scale.set(p.s * 1.25 * k, p.s * 0.9 * k, p.s * k); p.m.position.y = p.y + Math.sin(t * 0.45 + p.ph) * 0.35; });
        glow.material.opacity = 0.46 + 0.07 * Math.sin(t * 1.3) + 0.04 * Math.sin(t * 3.1);
      },
    };
    return g;
  }

  // ------------------------------------------------------------ the exterior: the tower on its crag under a night sky
  const MOON = new THREE.Vector3(-0.02, 0.24, -0.97).normalize();
  function buildExterior() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c1030');
    const uni = { uWarm: { value: 0 }, uSouth: { value: new THREE.Vector3(-0.07, 0, 1).normalize() } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uMoon: { value: MOON }, uSouth: uni.uSouth, uWarm: uni.uWarm },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uMoon; uniform vec3 uSouth; uniform float uWarm; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(vec3(0.21, 0.26, 0.52), vec3(0.035, 0.05, 0.17), pow(h, 0.45));
          float m = max(dot(vDir, uMoon), 0.0);
          col += vec3(0.42, 0.5, 0.78) * (pow(m, 22.0) * 0.45 + pow(m, 5.0) * 0.12);
          float s = max(dot(normalize(vec3(vDir.x, 0.0, vDir.z) + 1e-5), uSouth), 0.0);
          col += vec3(1.0, 0.6, 0.27) * uWarm * pow(s, 220.0) * (1.0 - smoothstep(-0.02, 0.07, vDir.y)) * 0.45;
          gl_FragColor = vec4(col, 1.0); }`,
    }));
    sky.renderOrder = -1; scene.add(sky);
    // stars in two sets that twinkle out of step, and the moon
    const R = rng(31), sets = [[], []];
    for (let i = 0; i < 700; i++) { const a = R() * TAU, y = 0.06 + Math.pow(R(), 0.75) * 0.94, r = Math.sqrt(1 - y * y); sets[i % 2].push(Math.cos(a) * r * 480, y * 480, Math.sin(a) * r * 480); }
    const stars = sets.map((pts, k) => {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const s = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#fff6dc', size: k ? 3.0 : 4.4, sizeAttenuation: false, map: glowTex, transparent: true, depthWrite: false, fog: false }));
      s.renderOrder = -1; scene.add(s); return s;
    });
    const moonTex = canvasTex(128, 128, c => {
      c.fillStyle = '#fbf1d4'; c.beginPath(); c.arc(64, 64, 52, 0, TAU); c.fill();
      c.fillStyle = '#ebdfb8'; [[44, 50, 11], [80, 78, 14], [72, 36, 7], [46, 88, 6]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
      c.lineWidth = 5; c.strokeStyle = INK; c.beginPath(); c.arc(64, 64, 52, 0, TAU); c.stroke();
    });
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, depthWrite: false })); moon.position.copy(MOON).multiplyScalar(440); moon.scale.setScalar(34); scene.add(moon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#7f95dd', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.position.copy(moon.position).multiplyScalar(1.01); halo.scale.setScalar(150); scene.add(halo);
    // rolling ground, far ridges in layers of haze, dark pines
    const hillH = (x, z) => { const r = Math.hypot(x, z); return (Math.sin(x * 0.021 + 1.2) * Math.cos(z * 0.017) * 3.2 + Math.sin(x * 0.05 - z * 0.04) * 1.1) * smoothstep(9, 40, r) + smoothstep(120, 420, r) * 10 - 0.4; };
    {
      const geo = new THREE.PlaneGeometry(1000, 1000, 110, 110); geo.rotateX(-Math.PI / 2);
      const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), A = new THREE.Color('#1c2640'), B = new THREE.Color('#253150'), D = new THREE.Color('#2e3a66');
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i); p.setY(i, hillH(x, z));
        c.copy(A).lerp(B, 0.5 + 0.5 * Math.sin(x * 0.09 + Math.cos(z * 0.07) * 2)).lerp(D, smoothstep(80, 420, Math.hypot(x, z)) * 0.8);
        col.set([c.r, c.g, c.b], i * 3);
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, toon('#ffffff', { vc: 1, rim: 0 })); m.receiveShadow = true; scene.add(m);
    }
    {
      const pcs = [], RR = rng(12);
      // two layers of far mountains: dark and near, hazy and far (the far ones fade toward the horizon sky)
      const gapA = Math.atan2(420, -30);   // leave a gap toward the far south, where the warm glow shows up in the end
      [[30, 175, 40, 9, 30, '#131930'], [24, 300, 60, 17, 46, '#222a55']].forEach(([n, d0, dd, h0, r0, col]) => {
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU + RR() * 0.15, d = d0 + RR() * dd, h = h0 + RR() * h0 * 0.9, r = r0 + RR() * r0 * 0.6, x = Math.cos(a) * d, z = Math.sin(a) * d;
          if (Math.abs(angDiff(a, gapA)) < (r * 1.1) / d + 0.04) continue;
          pcs.push({ geo: new THREE.ConeGeometry(1, 1, 7), m: M4(x, hillH(x, z) + h / 2 - 3, z, r, h, r, RR() * TAU), color: new THREE.Color(col).offsetHSL(0, 0, (RR() - 0.5) * 0.03) });
        }
      });
      scene.add(new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0 })));
      const trees = [], PC = ['#17202e', '#1b2535', '#141c29'];
      for (let i = 0; i < 70; i++) {
        const a = RR() * TAU, d = 13 + Math.pow(RR(), 0.6) * 90, x = Math.cos(a) * d, z = Math.sin(a) * d, s = 1.1 + RR() * 1.4, y = hillH(x, z) - 0.2;
        if (z > 8 && Math.abs(x) < 16) continue;   // keep the view to the door clear
        trees.push({ geo: G.cone, m: M4(x, y + 2.2 * s, z, 1.5 * s, 4.4 * s, 1.5 * s), color: PC[i % 3] });
        trees.push({ geo: G.cone, m: M4(x, y + 4.4 * s, z, 1.05 * s, 3.2 * s, 1.05 * s), color: PC[(i + 1) % 3] });
      }
      scene.add(new THREE.Mesh(merge(trees), toon('#ffffff', { vc: 1, rim: 0.15 })));
    }
    // light: a cool sky, the moon behind the tower, and a soft front fill so the stone still reads
    scene.add(new THREE.HemisphereLight('#6d7fcc', '#141a2c', 0.6));
    const moonL = new THREE.DirectionalLight('#d3dcff', 0.9); moonL.position.copy(MOON).multiplyScalar(100); scene.add(moonL);
    const fill = new THREE.DirectionalLight('#5d6cb8', 0.3); fill.position.set(-50, 34, 90); scene.add(fill);
    // the tower (tinted for the night), its Hush motes, and (for the end) a tiny warm glow far to the south
    const tower = buildTower({ fog: false, haze: 0.3, hazeColor: '#1b2150', ink: 0.07 }); scene.add(tower);
    const motes = (() => {
      const n = 90, pos = new Float32Array(n * 3), seeds = [], RM = rng(5);
      for (let i = 0; i < n; i++) seeds.push({ a: RM() * TAU, r: 3.4 + RM() * 6, y: 19 + RM() * 13, sp: 0.05 + RM() * 0.1, ph: RM() * TAU });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#c8c6d8', size: 0.42, map: glowTex, transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
      pts.frustumCulled = false; scene.add(pts);
      return { pos, seeds, geo };
    })();
    const sx = -30, sz = 420, gp = new THREE.Vector3(sx, hillH(sx, sz) + 3.5, sz);
    uni.uSouth.value.set(sx, 0, sz).normalize();
    const warm = [['#ffb44f', 15, 0.7], ['#fff1c2', 4.2, 1]].map(([c, s, o]) => {
      const w = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      w.position.copy(gp); w.scale.setScalar(s); w.userData.o = o; scene.add(w); return w;
    });
    function update(t) {
      tower.userData.animate(t);
      stars[0].material.opacity = 0.75 + 0.25 * Math.sin(t * 1.7); stars[1].material.opacity = 0.7 + 0.3 * Math.sin(t * 2.3 + 2);
      for (let i = 0; i < motes.seeds.length; i++) {
        const s = motes.seeds[i], a = s.a + t * s.sp;
        motes.pos[i * 3] = Math.cos(a) * s.r; motes.pos[i * 3 + 1] = s.y + Math.sin(t * 0.4 + s.ph) * 0.8; motes.pos[i * 3 + 2] = Math.sin(a) * s.r;
      }
      motes.geo.attributes.position.needsUpdate = true;
      const w = uni.uWarm.value * (0.85 + 0.15 * Math.sin(t * 2.2));
      warm.forEach(s => { s.material.opacity = w * s.userData.o; });
    }
    return { scene, uni, tower, warm, glowAt: gp, update };
  }

  // ------------------------------------------------------------ the hooded figure (small, cloaked, two pale eyes in the dark of the hood)
  const CLOAK = '#7b7590', CLOAK_D = '#5f5976', CLOAK_L = '#9790ab', HAND = '#d8d2e4';
  function buildFigure() {
    const root = new THREE.Group();
    const prof = [[0, 0], [0.455, 0], [0.47, 0.03], [0.41, 0.14], [0.33, 0.36], [0.27, 0.62], [0.235, 0.84], [0.19, 0.96], [0.11, 1.02], [0, 1.04]];   // bottom to top, so the faces point out
    const cg = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 30), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) {   // soft folds toward the hem
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + Math.sin(Math.atan2(x, z) * 7 + 0.5) * 0.075 * Math.pow(1 - y / 1.04, 2);
      cp.setX(i, x * k); cp.setZ(i, z * k);
    }
    cg.computeVertexNormals();
    const cloak = part(cg, CLOAK, null, null, { ink: 0.014, rim: 0.2 }); root.add(cloak);
    const lap = part(G.sphere, CLOAK, [0, 0, 0], [0.26, 0.12, 0.25], { ink: 0.012, rim: 0.2 }); root.add(lap);
    const patch = part(G.box, CLOAK_D, [0, 0, 0], [0.12, 0.11, 0.02], { ink: 0.007, rim: 0.1 }); root.add(patch);
    const feet = [-1, 1].map(s => { const f = part(G.sphere, '#3b3348', null, [0.065, 0.045, 0.1], { ink: 0.008 }); root.add(f); return f; });
    const upper = new THREE.Group(); root.add(upper);
    const arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * 0.19, 0, 0.02); upper.add(sh);
      sh.add(part(new THREE.CylinderGeometry(0.052, 0.085, 0.33, 12), CLOAK, [0, -0.16, 0], null, { ink: 0.012, rim: 0.2 }));
      sh.add(part(G.sphere, HAND, [0, -0.355, 0.012], [0.042, 0.048, 0.042], { ink: 0.009, emissive: '#121019', rim: 0.15 }));
      sh.userData.s = s; return sh;
    });
    const head = new THREE.Group(); head.rotation.order = 'YXZ'; upper.add(head);
    // the hood: soft, a little pointed, its top leaning back
    const hp = [[0, -0.05], [0.215, -0.05], [0.28, 0.05], [0.315, 0.17], [0.31, 0.29], [0.265, 0.41], [0.185, 0.5], [0.085, 0.565], [0, 0.585]];
    const hg = new THREE.LatheGeometry(hp.map(([x, y]) => new THREE.Vector2(x, y)), 28), hq = hg.attributes.position;
    for (let i = 0; i < hq.count; i++) {
      const y = hq.getY(i), z = hq.getZ(i), r = Math.hypot(hq.getX(i), z) || 1, k = smoothstep(0.12, 0.585, y);
      const over = z > 0 ? 0.06 * smoothstep(0.24, 0.36, y) * (1 - smoothstep(0.4, 0.52, y)) * Math.pow(z / r, 3) : 0;   // the brim overhangs the opening a little
      hq.setZ(i, z - k * k * 0.2 + over);
    }
    hg.computeVertexNormals();
    head.add(part(hg, CLOAK, null, null, { ink: 0.014, rim: 0.22 }));
    const hole = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#0c0912' })); hole.scale.set(0.19, 0.18, 0.135); hole.position.set(0, 0.19, 0.195); head.add(hole);
    const eyes = [-1, 1].map(s => {
      const e = new THREE.Group(); e.position.set(s * 0.066, 0.19, 0.326); head.add(e);
      const m = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#eef4ff' })); m.scale.set(0.03, 0.041, 0.014); e.add(m);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#9fc4ff', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
      gl.scale.setScalar(0.15); gl.position.z = 0.012; e.add(gl); e.userData.glow = gl; return e;
    });
    const tip1 = new THREE.Group(); tip1.position.set(0, 0.55, -0.17); head.add(tip1);
    tip1.add(part(new THREE.ConeGeometry(0.085, 0.2, 12), CLOAK, [0, 0.08, 0], null, { ink: 0.012, rim: 0.22 }));
    const tip2 = new THREE.Group(); tip2.position.set(0, 0.17, 0); tip1.add(tip2);
    tip2.add(part(new THREE.ConeGeometry(0.048, 0.15, 10), CLOAK, [0, 0.06, 0], null, { ink: 0.01, rim: 0.22 }));
    const book = buildNotebook(); upper.add(book.g);
    root.traverse(o => { if (o.isMesh && o.material.side !== THREE.BackSide) o.castShadow = true; });
    // pose: { sit 0..1, lean, yaw (head), pitch (head), clutch 0..1, walk (phase), blink }
    const P = { sit: 1, lean: 0.25, yaw: 0, pitch: 0.55, clutch: 0, walk: 0, stepping: 0, eyes: 1, t: 0 };
    function pose(dt) {
      const sit = P.sit, hem = lerp(0, 0.2, sit), sy = lerp(1, 0.81, sit), top = hem + 1.04 * sy, sw = lerp(1, 0.8, sit);
      cloak.position.y = hem; cloak.scale.set(sw, sy, sw);
      lap.visible = sit > 0.05; lap.position.set(0, hem + 0.22, 0.16 * sit + 0.05); lap.scale.set(0.25, 0.12 * sit + 0.01, 0.25 * sit + 0.02);
      head.visible = !P.hideHead;
      patch.position.set(0.05, hem + 0.55 * sy, -0.286 * sw - 0.006); patch.rotation.set(0.22, 0.12, 0.12);
      feet.forEach((f, i) => { const s = i ? 1 : -1, w = Math.sin(P.walk + i * Math.PI) * P.stepping; f.position.set(s * 0.1, 0.045 + Math.max(0, w) * 0.05, lerp(0.12, 0.34, sit) + w * 0.08); });
      upper.position.y = hem + 0.45 * sy; upper.rotation.x = P.lean;
      const sh = top - upper.position.y - 0.11;
      const c = P.clutch;
      arms.forEach(a => {
        const s = a.userData.s; a.position.y = sh;
        a.rotation.set(lerp(-0.78, -1.2, c), 0, -s * lerp(0.16, 0.6, c));
      });
      head.position.set(0, top - upper.position.y - 0.04, 0.03);
      head.rotation.y = P.yaw; head.rotation.x = P.pitch;
      tip1.rotation.set(-1.75 - P.pitch * 0.5 + Math.sin(P.t * 1.1) * 0.05, 0, Math.sin(P.t * 0.8) * 0.07); tip2.rotation.set(-0.75 + Math.sin(P.t * 1.1 - 0.6) * 0.1, 0, 0);
      const blink = (P.t % 4.3) < 0.13;
      eyes.forEach(e => { e.scale.y = blink ? 0.15 : 1; e.userData.glow.material.opacity = 0.55 * P.eyes; e.visible = P.eyes > 0.02; });
      // the notebook: open on the lap, or closed and held to the chest
      book.g.position.set(lerp(0, 0.1, ease(c)), lerp(sh - 0.29, sh - 0.02, c), lerp(0.3, 0.29, c));
      book.g.rotation.set(lerp(-0.62, -1.42, c) - P.lean * 0.6, 0, lerp(0.16, 0, c));
      book.close(c);
    }
    return { root, P, pose, book, head };
  }

  // Noa's notebook: a kraft cover, cream pages with lines of handwriting that the Hush can take away
  function buildNotebook() {
    const g = new THREE.Group(), W = 0.2, H = 0.27;
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 336;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    const kraft = tmat('#a9784a', { rim: 0.2 }), pageM = tmat('#f4efe4', { map: tex, rim: 0, emissive: '#4c4858' });
    pageM.emissiveMap = tex;   // the paper catches a little moonlight even in the hood's shadow
    const halves = [-1, 1].map(side => {
      const h = new THREE.Group(); g.add(h);
      h.add(part(new THREE.BoxGeometry(W, 0.008, H), null, [side * W / 2, 0, 0], null, { mat: kraft, ink: 0.006 }));
      h.add(part(new THREE.BoxGeometry(W * 0.95, 0.014, H * 0.95), '#efe5cc', [side * W * 0.49, 0.011, 0], null, { ink: 0, rim: 0.1 }));
      const pg = new THREE.PlaneGeometry(W * 0.93, H * 0.93); pg.rotateX(-Math.PI / 2);
      const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, side < 0 ? uv.getX(i) * 0.5 : 0.5 + uv.getX(i) * 0.5);
      const page = new THREE.Mesh(pg, pageM); page.position.set(side * W * 0.49, 0.0185, 0); page.receiveShadow = true; h.add(page);
      h.userData.page = page; return h;
    });
    halves[0].rotation.z = -0.15; halves[1].rotation.z = 0.15;
    // the handwriting: two pages of little scribbled words, each with its own moment to fade
    const R = rng(9), words = [];
    for (let pg = 0; pg < 2; pg++) for (let ln = 0; ln < 9; ln++) {
      let x = 26 + pg * 256 + (ln === 0 ? 34 : 0);
      const y = 44 + ln * 31, end = 256 * (pg + 1) - 24 - (ln === 8 ? 96 : R() * 34);
      while (x < end - 16) {
        const w = Math.min(16 + R() * 44, end - x); if (w < 12) break;
        words.push({ pg, x, y, w, seed: R() * 100, t0: ((pg * 9 + ln) / 18) * 0.74 + ((x - pg * 256) / 256) * 0.1 + R() * 0.06, gone: false });
        x += w + 9 + R() * 7;
      }
    }
    const INKC = new THREE.Color('#2d2645'), GRAY = new THREE.Color('#aaa6ba'), cc = new THREE.Color();
    let drawn = -1;
    function draw(p) {
      if (Math.abs(p - drawn) < 0.004) return; drawn = p;
      const c = cv.getContext('2d');
      c.fillStyle = '#f5ecd6'; c.fillRect(0, 0, 512, 336);
      c.fillStyle = 'rgba(70,110,170,0.16)'; for (let y = 50; y < 330; y += 31) { c.fillRect(14, y, 228, 2); c.fillRect(270, y, 228, 2); }
      c.fillStyle = 'rgba(120,90,60,0.25)'; c.fillRect(254, 0, 4, 336);
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const w of words) {
        const a = 1 - smoothstep(w.t0, w.t0 + 0.13, p); if (a <= 0.01) continue;
        cc.copy(INKC).lerp(GRAY, smoothstep(w.t0 - 0.02, w.t0 + 0.1, p));
        c.strokeStyle = `rgba(${cc.r * 255 | 0},${cc.g * 255 | 0},${cc.b * 255 | 0},${a.toFixed(3)})`; c.lineWidth = 2.6;
        c.beginPath();
        for (let k = 0; k <= w.w; k += 2) {
          const yy = w.y + Math.sin(k * 0.55 + w.seed) * 4.2 + Math.sin(k * 0.21 + w.seed * 2) * 1.6 - (Math.sin(k * 0.13 + w.seed) > 0.85 ? 5 : 0);
          k ? c.lineTo(w.x + k, yy) : c.moveTo(w.x + k, yy);
        }
        c.stroke();
      }
      tex.needsUpdate = true;
    }
    draw(0);
    // world position of a word on its page (for the motes that lift off it)
    function wordPos(w, out) {
      const h = halves[w.pg], page = h.userData.page, u = (w.x + w.w / 2 - w.pg * 256) / 256, v = w.y / 336;
      out.set((u - 0.5) * W * 0.93, 0.002, (v - 0.5) * H * 0.93);
      return page.localToWorld(out);
    }
    return {
      g, words, draw, wordPos,
      close(k) { halves[1].rotation.z = lerp(0.15, Math.PI - 0.15 - 0.035, ease(k)); },
      reset() { words.forEach(w => { w.gone = false; }); drawn = -1; draw(0); },
    };
  }

  // ------------------------------------------------------------ the interior: the round top room
  const RR = 4.2, WIN = { y: 1.05, z: -4.03, w: 1.3, h: 2.5 }, SEAT = new THREE.Vector3(1.05, 0, -2.75), SEAT_YAW = Math.atan2(0.42, -0.91);
  const BELL = new THREE.Vector3(-1.9, 0, -1.9);
  function buildInterior() {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#07060c');
    const R = rng(44), uni = { warm: 0, outside: true };   // outside: the night seen through the window (off when the camera is out there)
    // walls: rows of stone blocks over dark mortar, open where the window is
    const blocks = [], SC = ['#6f6982', '#79738c', '#655f78', '#837d95', '#5d586e'];
    const winHalf = (WIN.w / 2 + 0.05) / RR;
    for (let j = 0; j < 17; j++) {
      const y = 0.2 + j * 0.4, n = 38, off = (j % 2) * 0.5;
      for (let i = 0; i < n; i++) {
        const a = ((i + off) / n) * TAU, bw = (TAU * RR) / n - 0.06;
        const inWin = Math.abs(angDiff(a, Math.PI)) < winHalf + Math.PI / n * 0.9 && y > WIN.y - 0.15 && y < WIN.y + WIN.h + 0.25;
        if (inWin) continue;
        const r = RR - R() * 0.04;
        blocks.push({ geo: G.box, m: M4(Math.sin(a) * r, y, Math.cos(a) * r, bw * (0.92 + R() * 0.08), 0.34 + R() * 0.025, 0.34, a), color: SC[(R() * SC.length) | 0] });
      }
    }
    const wall = new THREE.Mesh(merge(blocks), toon('#ffffff', { vc: 1, rim: 0.12 })); wall.castShadow = wall.receiveShadow = true; scene.add(wall);
    const mortar = toon('#1d1927', { rim: 0, side: THREE.BackSide });
    const back = (h, y, t0, tl) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(RR + 0.2, RR + 0.2, h, 48, 1, true, t0, tl), mortar); m.position.y = y; m.castShadow = true; scene.add(m); };
    back(7.0, 3.5, Math.PI + 0.21, TAU - 0.42); back(WIN.y, WIN.y / 2, Math.PI - 0.21, 0.42); back(7.0 - WIN.y - WIN.h, (WIN.y + WIN.h + 7.0) / 2, Math.PI - 0.21, 0.42);
    // the window: a stone arch, a sill, a wooden mullion cross, and the night outside
    const stone = '#a39db3';
    const frame = part(new THREE.ExtrudeGeometry(archShape(WIN.w + 0.5, WIN.h + 0.3, archPath(WIN.w, WIN.h, 0, 0.02)), { depth: 0.45, bevelEnabled: false, curveSegments: 12 }), stone, [0, WIN.y, -(RR + 0.25)], null, { ink: 0.02 });
    frame.receiveShadow = true; scene.add(frame);
    scene.add(part(G.box, stone, [0, WIN.y - 0.07, -(RR - 0.1)], [WIN.w + 0.6, 0.15, 0.62], { ink: 0.02 }));
    scene.add(part(G.box, '#3b2d2a', [0, WIN.y + WIN.h / 2, -(RR + 0.05)], [0.07, WIN.h, 0.07], { ink: 0.012 }));
    scene.add(part(G.box, '#3b2d2a', [0, WIN.y + WIN.h * 0.5, -(RR + 0.05)], [WIN.w, 0.07, 0.07], { ink: 0.012 }));
    const outside = canvasTex(256, 192, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1236'); g.addColorStop(0.75, '#2d3a78'); g.addColorStop(1, '#3d4c8c');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const RS = rng(3); c.fillStyle = '#fff6dc'; for (let i = 0; i < 60; i++) { const s = RS() < 0.2 ? 2 : 1; c.fillRect(RS() * w, RS() * h * 0.7, s, s); }
      c.fillStyle = '#18203f'; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, h * 0.86 - Math.sin(x * 0.035) * 9 - Math.sin(x * 0.11) * 3); c.lineTo(w, h); c.fill();
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), new THREE.MeshBasicMaterial({ map: outside }));
    sky.position.set(0, 2.4, -(RR + 1.6)); scene.add(sky);
    const warmSky = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), new THREE.MeshBasicMaterial({ map: canvasTex(16, 128, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(0.62, 'rgba(255,190,90,0.55)'); g.addColorStop(0.86, 'rgba(255,214,140,1)'); g.addColorStop(1, 'rgba(255,170,80,0.9)');
      c.fillStyle = g; c.fillRect(0, 0, w, h); }), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    warmSky.position.set(0, 2.4, -(RR + 1.55)); scene.add(warmSky);
    const warmGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc566', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    warmGlow.position.set(0.2, 1.7, -(RR + 1.2)); warmGlow.scale.setScalar(3.6); scene.add(warmGlow);
    // floor planks over a dark base, a ceiling of rafters, the beam the bell fell from
    const planks = [], PC = ['#6b4a36', '#755240', '#5f412f', '#7d5a44', '#684634'];
    for (let x = -RR - 0.1; x < RR + 0.1; x += 0.42) {
      const len = 2 * Math.sqrt(Math.max(0, (RR + 0.1) * (RR + 0.1) - (Math.abs(x + 0.21) + 0.19) * (Math.abs(x + 0.21) + 0.19)));
      if (len < 0.5) continue;
      planks.push({ geo: G.box, m: M4(x + 0.21, 0.04 + R() * 0.012, (R() - 0.5) * 0.1, 0.385, 0.08, len, (R() - 0.5) * 0.012), color: PC[(R() * PC.length) | 0] });
    }
    const floor = new THREE.Mesh(merge(planks), toon('#ffffff', { vc: 1, rim: 0.08 })); floor.receiveShadow = true; scene.add(floor);
    const base = new THREE.Mesh(new THREE.CircleGeometry(RR + 0.3, 48), toon('#24191a', { rim: 0 })); base.rotation.x = -Math.PI / 2; base.receiveShadow = true; scene.add(base);
    const roofIn = new THREE.Mesh(new THREE.ConeGeometry(RR + 0.25, 3.8, 24, 1, true), toon('#1b1724', { rim: 0, side: THREE.BackSide })); roofIn.position.y = 8.7; scene.add(roofIn);
    const wood = '#4a3a33';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; scene.add(part(G.box, wood, [Math.sin(a) * 2.2, 8.5, Math.cos(a) * 2.2], [0.2, 0.2, 5.4], { rot: [-0.74, a, 0], ink: 0.012 })); }
    scene.add(part(G.box, wood, [0, 6.1, -0.5], [2 * RR + 0.4, 0.38, 0.38], { ink: 0.015 }));
    {
      const rope = new THREE.Group(); rope.position.set(-1.4, 5.92, -0.5); rope.rotation.z = 0.05; scene.add(rope);
      rope.add(part(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8), '#9a8463', [0, -0.65, 0], null, { ink: 0.01 }));
      [-1, 0, 1].forEach(k => rope.add(part(new THREE.ConeGeometry(0.022, 0.15, 5), '#9a8463', [k * 0.022, -1.35, 0], null, { rot: [0, 0, Math.PI + k * 0.35], ink: 0.006 })));
      scene.add(part(new THREE.TorusGeometry(0.14, 0.032, 6, 14), '#55505c', [-1.4, 5.88, -0.5], null, { rot: [0, Math.PI / 2, 0], ink: 0.008 }));
    }
    // the bell: huge, old, bronze, cracked, lying on its side
    const bellTex = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#a07246'; c.fillRect(0, 0, w, h);
      const RB = rng(8); c.fillStyle = 'rgba(102,150,128,0.55)';
      for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(RB() * w, RB() * h, 6 + RB() * 16, 4 + RB() * 10, RB() * 3, 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(70,46,30,0.35)'; c.fillRect(0, h * 0.18, w, 6); c.fillRect(0, h * 0.24, w, 3); c.fillRect(0, h * 0.86, w, 5);
      c.strokeStyle = '#1a1220'; c.lineWidth = 6; c.lineJoin = 'round'; c.beginPath();
      const cx = w * 0.3; c.moveTo(cx, 0); [[8, 22], [-6, 44], [10, 70], [-4, 92], [7, 118], [-3, 140], [4, 158]].forEach(([dx, y]) => c.lineTo(cx + dx, y)); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 10, 70); c.lineTo(cx + 26, 84); c.lineTo(cx + 30, 98); c.stroke();
    });
    const bprof = [[0.03, 1.96], [0.33, 1.93], [0.49, 1.84], [0.57, 1.62], [0.61, 1.3], [0.67, 0.95], [0.79, 0.6], [0.99, 0.3], [1.15, 0.1], [1.21, 0.02], [1.13, 0.0]];
    const bellM = tmat('#ffffff', { map: bellTex, side: THREE.DoubleSide, rim: 0.3 });
    const bellRoot = new THREE.Group(); bellRoot.position.copy(BELL); bellRoot.rotation.y = -0.38; bellRoot.scale.setScalar(0.85); scene.add(bellRoot);
    const tip = new THREE.Group(); tip.position.y = 1.12; tip.rotation.z = 1.93; bellRoot.add(tip);
    const spin = new THREE.Group(); spin.rotation.y = -0.15; tip.add(spin);
    const bellGeo = new THREE.LatheGeometry(bprof.slice().reverse().map(([x, y]) => new THREE.Vector2(x, y)), 36);   // lip to crown, faces out
    bellTex.flipY = false;   // so the canvas top is the lip, where the crack starts
    const bell = part(bellGeo, null, null, null, { mat: bellM, ink: 0.025 }); bell.receiveShadow = true; spin.add(bell);
    spin.add(part(new THREE.TorusGeometry(1.17, 0.07, 8, 40), '#8f643b', [0, 0.04, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0.02 }));
    [0, Math.PI / 2].forEach(r => spin.add(part(new THREE.TorusGeometry(0.17, 0.06, 8, 16), '#8f643b', [0, 2.05, 0], null, { rot: [0, r, 0], ink: 0.012 })));
    const clap = new THREE.Group(); clap.position.y = 1.85; clap.rotation.z = -0.4; spin.add(clap);
    clap.add(part(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 8), '#4b4450', [0, -0.65, 0], null, { ink: 0.01 }));
    clap.add(part(G.sphere, '#4b4450', [0, -1.36, 0], [0.19, 0.19, 0.19], { ink: 0.012 }));
    scene.add(part(new THREE.CylinderGeometry(1.0, 1.0, 0.24, 6, 1, true, 0, 0.45), null, [BELL.x + 1.15, 0.05, BELL.z + 0.95], null, { mat: bellM, rot: [Math.PI / 2 - 0.1, 0, 0.3], ink: 0.012 }));
    // points along the crack, in the bell's own frame (u = 0.3 of the way round, from the lip up)
    const crack = [];
    { const phi = 0.3 * TAU; for (let k = 0; k <= 6; k++) { const j = 10 - k * 0.9, a = Math.floor(j), f = j - a, b = Math.min(10, a + 1), r = lerp(bprof[a][0], bprof[b][0], f), y = lerp(bprof[a][1], bprof[b][1], f); crack.push(new THREE.Vector3(Math.sin(phi) * r * 1.02, y, Math.cos(phi) * r * 1.02)); } }
    // the stool, a few props: books, blank pages, crumpled paper, a cold candle
    const stool = new THREE.Group(); stool.position.copy(SEAT); stool.rotation.y = 0.4; scene.add(stool);
    stool.add(part(new THREE.CylinderGeometry(0.25, 0.24, 0.07, 14), '#7a5a40', [0, 0.45, 0], null, { ink: 0.012 }));
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; stool.add(part(new THREE.CylinderGeometry(0.028, 0.036, 0.48, 6), '#6a4c36', [Math.sin(a) * 0.26, 0.22, Math.cos(a) * 0.26], null, { rot: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5], ink: 0.008 })); }
    [['#5f5970', 0.5, 0.11, 0.36, 0.1], ['#585b6e', 0.44, 0.1, 0.32, -0.2], ['#6a6378', 0.38, 0.09, 0.28, 0.25]].forEach(([c, w, h, d, r], i) =>
      scene.add(part(G.box, c, [2.75, 0.06 + h / 2 + i * 0.105, -0.9], [w, h, d], { rot: [0, 0.9 + r, 0], ink: 0.01 })));
    const pageM = toon('#f3ead6', { rim: 0.05 });
    [[0.17, -1.95, 0.4], [1.75, -1.7, -0.9], [-0.47, -2.8, 1.3], [1.45, -1.15, 2.2]].forEach(([x, z, r]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.27), pageM); m.rotation.set(-Math.PI / 2, 0, r); m.position.set(x, 0.086, z); m.receiveShadow = true; scene.add(m); });
    scene.add(part(new THREE.CylinderGeometry(0.055, 0.06, 0.16, 10), '#e9e1cf', [-0.46, WIN.y + 0.09, -(RR - 0.27)], null, { ink: 0.008 }));
    scene.add(part(new THREE.CylinderGeometry(0.11, 0.09, 0.025, 12), '#55505c', [-0.46, WIN.y + 0.015, -(RR - 0.27)], null, { ink: 0.008 }));
    // light: dim cold air, moonlight through the window (shadows on the floor), a warm light for the end
    const hemi = new THREE.HemisphereLight('#4d5592', '#1a1520', 0.5); scene.add(hemi);
    const fill = new THREE.DirectionalLight('#56609e', 0.22); fill.position.set(3, 5, 6); scene.add(fill);
    const bellL = new THREE.PointLight('#8e9bff', 0.9, 4.5, 1.5); bellL.position.set(BELL.x + 1.0, 2.3, BELL.z + 1.5); scene.add(bellL);
    const moon = new THREE.SpotLight('#c2cdf2', 1.35, 26, 0.34, 0.35, 1);
    moon.position.set(-2.1, 6.6, -8.6); moon.target.position.set(1.1, 0, -1.9);
    moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); moon.shadow.camera.near = 3; moon.shadow.camera.far = 24; moon.shadow.bias = -0.0012; moon.shadow.normalBias = 0.02;
    scene.add(moon, moon.target);
    const warmL = new THREE.PointLight('#ffb24a', 0, 7, 1.6); warmL.position.set(0, 2.5, -4.5); scene.add(warmL);
    // a shaft of moonlight with dust in it
    const shaftTex = canvasTex(64, 128, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.1, 'rgba(255,255,255,0.85)'); g.addColorStop(0.45, 'rgba(255,255,255,0.3)'); g.addColorStop(0.75, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
    });
    shaftTex.wrapS = THREE.RepeatWrapping; shaftTex.repeat.x = 4;
    const top = new THREE.Vector3(0.0, WIN.y + WIN.h * 0.55, -(RR + 0.05)), bot = new THREE.Vector3(1.15, 0.05, -1.85), dir = bot.clone().sub(top), L = dir.length();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, L, 4, 1, true), new THREE.MeshBasicMaterial({ map: shaftTex, color: '#a9c2ff', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    shaft.position.copy(top).addScaledVector(dir, 0.5); shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.clone().normalize()); shaft.rotateY(Math.PI / 4);
    scene.add(shaft);
    const dust = [];
    for (let i = 0; i < 34; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#dfe8ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.setScalar(0.035 + R() * 0.03); scene.add(s); dust.push({ s, k: R(), ox: (R() - 0.5) * 1.2, oz: (R() - 0.5) * 0.9, ph: R() * TAU, sp: 0.02 + R() * 0.03 });
    }
    // the figure on the stool
    const fig = buildFigure(); fig.root.position.copy(SEAT); fig.root.rotation.y = SEAT_YAW; scene.add(fig.root);
    // the Hush: mist out of the bell's crack, motes off the page, a few gray specks in the air
    const sprites = (n, color, opts = {}) => Array.from({ length: n }, () => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map: puffTex, color, transparent: true, opacity: 0, depthWrite: false }, opts)));
      s.visible = false; scene.add(s); return { s, life: 0, max: 1, on: false };
    });
    const mist = { pool: sprites(110, '#b3afc6'), acc: 0, rate: 9, swirl: 0.3, thick: 1 };
    const motes = { pool: sprites(70, '#8e89a8', { map: glowTex }), list: [] };
    const air = (() => {
      const n = 60, pos = new Float32Array(n * 3), seeds = [];
      for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 4.3; seeds.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, y: 0.4 + R() * 4.5, ph: R() * 9 }); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#bdb9d0', size: 0.06, map: glowTex, transparent: true, opacity: 0.55, depthWrite: false }));
      pts.frustumCulled = false; scene.add(pts); return { pos, seeds, geo };
    })();
    const crackW = crack.map(() => new THREE.Vector3());
    function spawnMist() {
      const m = mist.pool.find(p => !p.on); if (!m) return;
      bell.updateMatrixWorld(true);
      const i = (Math.random() * crack.length) | 0; m.s.position.copy(crack[i]); bell.localToWorld(m.s.position);
      m.on = true; m.s.visible = true; m.life = 0; m.max = 3.2 + Math.random() * 2.2; m.vy = 0.14 + Math.random() * 0.16; m.size = 0.24 + Math.random() * 0.26; m.ph = Math.random() * TAU;
    }
    function puffMote(p) {
      const m = motes.pool.find(q => !q.on); if (!m) return;
      m.on = true; m.s.visible = true; m.life = 0; m.max = 1.6 + Math.random() * 1.2; m.s.position.copy(p);
      m.vx = (Math.random() - 0.5) * 0.06; m.vy = 0.1 + Math.random() * 0.12; m.vz = (Math.random() - 0.5) * 0.06; m.size = 0.012 + Math.random() * 0.014;
    }
    function update(t, dt) {
      fig.P.t = t; fig.pose(dt);
      const w = uni.warm;
      // moonlight turns gold when the warm light comes in from the south
      moon.color.set('#c2cdf2').lerp(new THREE.Color('#ffc05a'), Math.min(1, w)); moon.intensity = 1.35 + w * 0.95;
      warmL.intensity = w * 0.95; warmSky.material.opacity = Math.min(1, w * 1.1); warmGlow.material.opacity = Math.min(1, w * 0.85);
      sky.visible = warmSky.visible = warmGlow.visible = uni.outside;
      hemi.color.set('#4d5592').lerp(new THREE.Color('#7a6070'), Math.min(1, w) * 0.35);
      shaft.material.color.set('#a9c2ff').lerp(new THREE.Color('#ffcf77'), Math.min(1, w)); shaft.material.opacity = 0.17 + 0.04 * Math.sin(t * 0.7) + w * 0.16;
      dust.forEach(d => {
        const k = (d.k + t * d.sp) % 1; d.s.position.copy(top).addScaledVector(dir, 0.1 + k * 0.85);
        d.s.position.x += d.ox * (0.4 + k) + Math.sin(t * 0.5 + d.ph) * 0.08; d.s.position.z += d.oz * (0.4 + k); d.s.position.y += Math.sin(t * 0.7 + d.ph) * 0.05;
        d.s.material.opacity = (0.35 + 0.35 * Math.sin(t * 1.3 + d.ph * 3)) * Math.sin(k * Math.PI);
        d.s.material.color.set('#dfe8ff').lerp(new THREE.Color('#ffe2a0'), Math.min(1, w));
      });
      // mist: rises out of the crack and swirls around the bell
      mist.acc += dt * mist.rate * mist.thick;
      while (mist.acc > 1) { mist.acc -= 1; spawnMist(); }
      for (const m of mist.pool) {
        if (!m.on) continue;
        m.life += dt; const k = m.life / m.max;
        if (k >= 1) { m.on = false; m.s.visible = false; continue; }
        const p = m.s.position, dx = p.x - BELL.x, dz = p.z - BELL.z, a = mist.swirl * dt * (0.6 + k), ca = Math.cos(a), sa = Math.sin(a);
        p.x = BELL.x + dx * ca - dz * sa + dx * 0.05 * dt; p.z = BELL.z + dx * sa + dz * ca + dz * 0.05 * dt;
        p.y += m.vy * dt * (1 - k * 0.5);
        m.s.scale.setScalar(m.size * (0.6 + k * 1.6) * (0.8 + 0.2 * mist.thick));
        m.s.material.opacity = Math.sin(Math.min(1, k * 1.25) * Math.PI) * 0.44 * Math.min(1.4, 0.75 + 0.25 * mist.thick);
        m.s.material.rotation = m.ph + t * 0.2;
      }
      for (const m of motes.pool) {
        if (!m.on) continue;
        m.life += dt; const k = m.life / m.max;
        if (k >= 1) { m.on = false; m.s.visible = false; continue; }
        m.s.position.x += (m.vx + Math.sin(t * 2 + m.max * 9) * 0.03) * dt; m.s.position.y += m.vy * dt; m.s.position.z += m.vz * dt;
        m.s.scale.setScalar(m.size * (1 - k * 0.4)); m.s.material.opacity = Math.min(1, k * 6) * (1 - k) * 0.95;
      }
      for (let i = 0; i < air.seeds.length; i++) {
        const s = air.seeds[i];
        air.pos[i * 3] = s.x + Math.sin(t * 0.21 + s.ph) * 0.5; air.pos[i * 3 + 1] = s.y + Math.sin(t * 0.33 + s.ph * 2) * 0.3; air.pos[i * 3 + 2] = s.z + Math.cos(t * 0.17 + s.ph) * 0.5;
      }
      air.geo.attributes.position.needsUpdate = true;
    }
    function clearFx() { mist.pool.concat(motes.pool).forEach(m => { m.on = false; m.s.visible = false; }); mist.acc = 0; }
    return { scene, uni, fig, mist, update, puffMote, clearFx, bell, WIN };
  }

  // ------------------------------------------------------------ the journey north (beat 'journey'): your home station, the train, the land going by
  // Daylight in the same drawing rule: TK's cel ramp and #2b2235 ink. Props are merged pieces with one
  // closed hull: every piece again, grown by k all round and drawn back-faced (so boxes keep their corners).
  const shells = {};
  const shellMat = (fog = true) => shells[fog] || (shells[fog] = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, fog }));
  const PB = (x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) => ({ geo: G.box, color, m: M4(x, y, z, sx, sy, sz, ry, rx, rz), hm: k => M4(x, y, z, sx + 2 * k, sy + 2 * k, sz + 2 * k, ry, rx, rz) });
  const PC = (x, y, z, r, h, color, ry = 0, rx = 0, rz = 0, geo = G.cyl) => ({ geo, color, m: M4(x, y, z, r, h, r, ry, rx, rz), hm: k => M4(x, y, z, r + k, h + 2 * k, r + k, ry, rx, rz) });
  const PS = (x, y, z, sx, sy, sz, color, geo = G.sphere, ry = 0, rx = 0, rz = 0) => ({ geo, color, m: M4(x, y, z, sx, sy, sz, ry, rx, rz), hm: k => M4(x, y, z, sx + k, sy + k, sz + k, ry, rx, rz) });
  const bare = p => Object.assign(p, { k: 0 });   // a piece without a hull
  function solid(pieces, k = 0.02, o = {}) {
    const m = new THREE.Mesh(merge(pieces), o.mat || toon('#ffffff', { vc: 1, rim: o.rim === undefined ? 0.15 : o.rim }));
    m.castShadow = o.shadow !== false; m.receiveShadow = true;
    const hp = k ? pieces.filter(p => p.k !== 0) : [];
    if (hp.length) { const h = new THREE.Mesh(merge(hp.map(p => ({ geo: p.geo, m: p.hm(p.k || k), color: INK }))), shellMat(o.fog !== false)); h.castShadow = false; m.add(h); }
    return m;
  }
  // a hull for one mesh: its own shape grown by k (sx, sy, sz: the shape's size), drawn back-faced
  function shell(m, k, sx, sy, sz, fog = true) { const h = new THREE.Mesh(m.geometry, shellMat(fog)); h.scale.set(1 + 2 * k / sx, 1 + 2 * k / sy, 1 + 2 * k / sz); h.castShadow = false; m.add(h); return m; }
  const lathe = (pts, n = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  const GEO = {};   // shapes the journey's scenes share, made on first use
  const shape = (k, make) => GEO[k] || (GEO[k] = make());
  // a gable: a triangular prism 1 long (x), 1 wide (z), 1 tall (y), its apex up and its base at y = -1/3
  const PRISM = () => shape('prism', () => { let g = new THREE.CylinderGeometry(1, 1, 1, 3); g.rotateZ(-Math.PI / 2); g.rotateX(-Math.PI / 2); g.scale(1, 1 / 1.5, 1 / Math.sqrt(3)); g = g.toNonIndexed(); g.computeVertexNormals(); return g; });
  // a round tree like the world's: a trunk and six leafy blobs (vertex colors)
  const ROUND = () => shape('round', () => merge([{ geo: new THREE.CylinderGeometry(0.2, 0.34, 2.4, 7), m: M4(0, 1.2, 0, 1), color: '#8a5f3e' },
    ...[[0, 3.0, 0, 1.25], [0.9, 2.6, 0.3, 0.95], [-0.85, 2.7, -0.2, 1.0], [0.2, 3.7, -0.3, 0.9], [-0.3, 2.5, 0.85, 0.85], [0.4, 2.6, -0.85, 0.85]]
      .map(([x, y, z, r], i) => ({ geo: G.ico1, m: M4(x, y, z, r), color: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#4b973f'][i] }))]));
  const HILL = () => shape('hill', () => merge([{ geo: new THREE.SphereGeometry(1, 22, 8, 0, TAU, 0, Math.PI / 2), m: M4(0, 0, 0, 1), color: '#ffffff' }]));
  const CLOUD = () => shape('cloud', () => merge([[0, 0, 0, 1.0], [1.15, -0.18, 0.15, 0.72], [-1.1, -0.22, 0.1, 0.68], [0.5, 0.42, -0.1, 0.7], [-0.45, 0.35, 0.05, 0.6]]
    .map(([x, y, z, r]) => ({ geo: G.ico1, m: M4(x, y, z, r, r * 0.78, r * 0.85), color: '#ffffff' }))));
  // a sky: horizon to zenith, and a soft glow around the sun (glow 0 = none)
  function skyDome(top, hor, sun, glow = 1) {
    const u = { uTop: { value: new THREE.Color(top) }, uHor: { value: new THREE.Color(hor) }, uSun: { value: sun.clone().normalize() }, uGlow: { value: glow } };
    const m = new THREE.Mesh(new THREE.SphereGeometry(470, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform float uGlow; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 col = mix(uHor, uTop, pow(h, 0.5));
          col += vec3(1.0, 0.86, 0.6) * pow(max(dot(vDir, uSun), 0.0), 7.0) * 0.32 * uGlow;
          gl_FragColor = vec4(col, 1.0); }` }));
    m.renderOrder = -1; m.frustumCulled = false; return { mesh: m, u };
  }
  // instanced copies of a vertex-colored shape: [{ x, y, z, s or sx/sy/sz, ry, tint (a gray 0..1, or a color) }]
  function many(g, mat, list, o = {}) {
    const im = new THREE.InstancedMesh(g, mat, list.length), c = new THREE.Color();
    list.forEach((t, i) => { im.setMatrixAt(i, M4(t.x, t.y || 0, t.z, t.sx || t.s || 1, t.sy || t.s || 1, t.sz || t.s || 1, t.ry || 0)); im.setColorAt(i, typeof t.tint === 'number' ? c.setRGB(t.tint, t.tint, t.tint) : c.set(t.tint || '#ffffff')); });
    im.castShadow = !!o.shadow; im.receiveShadow = !!o.receive; im.frustumCulled = false;
    return im;
  }
  // the north drains the color out of the land: GRAY (0..1) pulls a material's lit color toward a dull gray
  const GRAY = { value: 0 };
  function drained(m) {
    const pre = m.onBeforeCompile, key = m.customProgramCacheKey();
    m.onBeforeCompile = (sh, r) => {
      pre.call(m, sh, r); sh.uniforms.uGray = GRAY;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <fog_fragment>',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(dot(gl_FragColor.rgb, vec3(0.3, 0.59, 0.11)) * 0.8 + 0.06), uGray);\n#include <fog_fragment>');
    };
    m.customProgramCacheKey = () => key + '|drain';
    return m;
  }

  // the little train from the last stop (world3d.js): the same teal engine with its red boiler and the same
  // yellow carriage with its red roof, here inked, with a door on the platform side to climb in by
  function buildTrain() {
    const g = new THREE.Group(), K = 0.032, TEAL = '#2f7f78', GLASS = '#a8e1f0', TRIM = '#c4962f', IRON = '#4a4552';
    const cyl18 = new THREE.CylinderGeometry(1, 1, 1, 18), stack = new THREE.CylinderGeometry(0.32, 0.22, 1.0, 12);
    const wheel = (x, y, z, r) => [PC(x, y, z, r, 0.2, INK, 0, Math.PI / 2, 0, cyl18), bare(PC(x, y, z + Math.sign(z) * 0.03, r * 0.38, 0.2, '#8a8d97', 0, Math.PI / 2))];
    const loco = new THREE.Group(); loco.position.x = 5.2; g.add(loco);
    loco.add(solid([
      PB(0, 1.3, 0, 4.2, 1.6, 2.2, TEAL), PB(-1.4, 2.6, 0, 1.8, 1.4, 2.3, TEAL), PB(-1.4, 3.35, 0, 2.1, 0.18, 2.5, INK),
      PC(0.9, 2.4, 0, 0.85, 3.0, '#e0503f', 0, 0, Math.PI / 2, cyl18),
      { geo: stack, color: INK, m: M4(1.8, 3.4, 0, 1), hm: k => M4(1.8, 3.4, 0, 1 + k / 0.27, 1 + 2 * k, 1 + k / 0.27) },
      ...[-1.3, 0, 1.3].flatMap(x => [-1.15, 1.15].flatMap(z => wheel(x, 0.55, z, 0.48))),
      ...[-1, 1].map(s => bare(PB(0, 0.55, s * 1.3, 2.7, 0.08, 0.05, '#8a8d97'))),
    ], K));
    loco.add(solid([-1, 1].map(s => PB(-1.4, 2.8, s * 1.18, 0.9, 0.7, 0.05, GLASS)), 0.02, { rim: 0.5 }));
    const car = new THREE.Group(); g.add(car);
    car.add(solid([
      PB(0, 1.6, 0, 5.0, 2.2, 2.3, '#f2c94e'), PB(0, 2.8, 0, 5.3, 0.2, 2.6, '#c9553f'),
      ...[-1.6, 1.6].flatMap(x => [-1.15, 1.15].flatMap(z => wheel(x, 0.5, z, 0.4))),
      PB(-0.5, 1.72, 1.17, 0.09, 1.86, 0.05, TRIM), PB(0.5, 1.72, 1.17, 0.09, 1.86, 0.05, TRIM), PB(0, 2.62, 1.17, 1.09, 0.09, 0.05, TRIM),
      PB(0, 0.79, 1.2, 1.0, 0.06, 0.12, TRIM),
      PB(0, 0.6, 1.36, 0.8, 0.05, 0.3, IRON), ...[-0.34, 0.34].map(x => PB(x, 0.68, 1.27, 0.05, 0.18, 0.05, IRON)),
    ], K));
    car.add(solid([-1.6, 0, 1.6].map(x => PB(x, 1.9, -1.17, 1.0, 0.8, 0.05, GLASS)).concat([-1.6, 1.6].map(x => PB(x, 1.9, 1.17, 1.0, 0.8, 0.05, GLASS))), 0.02, { rim: 0.5 }));
    // the open doorway (dark inside: you climb in and you're gone) and the door, swung wide
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(0.91, 1.76), new THREE.MeshBasicMaterial({ color: '#3b2b2e' })); dark.position.set(0, 0.82 + 0.88, 1.156); car.add(dark);
    const door = new THREE.Group(); door.position.set(0.455, 0.82, 1.2); door.rotation.y = 1.95; car.add(door);
    door.add(solid([PB(-0.45, 0.88, 0, 0.9, 1.76, 0.06, '#f2c94e'), PB(-0.45, 1.25, 0.04, 0.48, 0.44, 0.02, GLASS), PB(-0.8, 0.85, 0.06, 0.07, 0.07, 0.06, TRIM)], K));
    return { g, car, loco, door };
  }
  // steam: round cartoon puffs that pop out of the stack, grow, drift back and shrink away
  function steamer(scene, n = 26) {
    const mat = toon('#ffffff', { rim: 0.35 }), pool = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(G.ico1, mat), h = new THREE.Mesh(G.ico1, shellMat()); h.scale.setScalar(1.08); m.add(h);
      m.visible = false; scene.add(m); pool.push({ m, on: false });
    }
    let acc = 0;
    return {
      rate: 0.55, at: new THREE.Vector3(),
      clear() { pool.forEach(p => { p.on = false; p.m.visible = false; }); acc = 0; },
      update(dt) {
        acc += dt;
        if (acc > this.rate) {
          acc = 0; const p = pool.find(q => !q.on);
          if (p) {
            Object.assign(p, { on: true, life: 0, max: 1.9 + Math.random() * 0.6, vx: -0.45 - Math.random() * 0.4, vy: 1.5 + Math.random() * 0.5, vz: (Math.random() - 0.5) * 0.4, s: 0.32 + Math.random() * 0.14 });
            p.m.position.copy(this.at); p.m.rotation.set(Math.random() * 3, Math.random() * 3, 0); p.m.visible = true;
          }
        }
        for (const p of pool) {
          if (!p.on) continue;
          p.life += dt; const k = p.life / p.max;
          if (k >= 1) { p.on = false; p.m.visible = false; continue; }
          p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt * (1 - k * 0.5); p.m.position.z += p.vz * dt;
          p.m.scale.setScalar(p.s * (0.45 + 0.95 * easeOutBack(Math.min(1, k * 2.2), 1.2)) * (1 - smoothstep(0.7, 1, k)));
        }
      },
    };
  }

  // ------------------------------------------------------------ you (a copy of the hero), your basket with the egg in it, Noa's letter
  function buildKit() {
    const hero = ACTORS.hero(), egg = ACTORS.egg(), H = ACTORS.HERO;
    const packs = hero.torso.children.filter(c => c.material === toon(H.pack) || c.material === toon(H.roll));   // they ride on the luggage rack
    // a worried face: two little slanted brows painted on the fringe, and the smile turned over
    const mouth = hero.head.children.find(c => c.geometry && c.geometry.type === 'TorusGeometry'), browM = new THREE.MeshBasicMaterial({ color: INK });
    const brows = [-1, 1].map(s => {
      const c = new THREE.Vector3(0, 0.27, -0.02), n = new THREE.Vector3(s * 0.125, 0.385, 0.345).sub(c).normalize();   // on the hair's sphere, facing out
      const g = new THREE.Group(); g.position.copy(c).addScaledVector(n, 0.393); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      const b = new THREE.Mesh(G.sphere, browM); b.scale.set(0.062, 0.017, 0.006); b.rotation.z = -s * 0.5; g.add(b);
      g.visible = false; hero.head.add(g); return g;
    });
    // the egg's shell, smoother for the close-up (the same profile as ACTORS.egg, more facets)
    const smooth = (pts, n) => new THREE.LatheGeometry(new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(n), 32);
    [[egg.lower, [[0, 0], [0.16, 0.02], [0.24, 0.12], [0.26, 0.26], [0.26, 0.27]], 16], [egg.upper, [[0.26, -0.01], [0.22, 0.13], [0.13, 0.23], [0, 0.26]], 14]].forEach(([grp, pts, n]) => {
      const m = grp.children.find(o => o.isMesh && o.geometry.type === 'LatheGeometry'); if (!m) return;
      const old = m.geometry, geo = smooth(pts, n); m.geometry = geo; m.children.forEach(h => { if (h.isMesh && h.geometry === old) h.geometry = geo; }); old.dispose();
    });
    // the basket: woven straw, a braided rim and a handle, a red gingham cloth with the egg nested in it
    const weave = canvasTex(64, 32, (c, w, h) => {
      c.fillStyle = '#d6a65c'; c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 16) { const o = (y / 8) % 2 ? 8 : 0; c.fillStyle = '#b8843f'; c.fillRect((x + o) % w, y + 1, 9, 6); c.fillStyle = 'rgba(255,238,196,0.4)'; c.fillRect((x + o) % w + 1, y + 1, 7, 2); }
      c.fillStyle = 'rgba(92,58,28,0.4)'; for (let y = 0; y < h; y += 8) c.fillRect(0, y, w, 1);
    });
    weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(7, 2);
    const basket = new THREE.Group(), STRAW = '#c48c48';
    const bowl = new THREE.Mesh(lathe([[0, 0], [0.15, 0], [0.185, 0.03], [0.2, 0.09], [0.21, 0.165]], 22), tmat('#ffffff', { map: weave, rim: 0.2, side: THREE.DoubleSide }));
    bowl.castShadow = true; shell(bowl, 0.012, 0.42, 0.33, 0.42); basket.add(bowl);
    basket.add(part(new THREE.TorusGeometry(0.21, 0.022, 6, 24), STRAW, [0, 0.165, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0.01, rim: 0.2 }));
    basket.add(part(new THREE.TorusGeometry(0.175, 0.017, 6, 16, Math.PI), STRAW, [0, 0.165, 0], null, { ink: 0.009, rim: 0.2 }));
    const ging = canvasTex(32, 32, (c, w, h) => { c.fillStyle = '#fbf6ee'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(206,62,56,0.55)'; c.fillRect(0, 0, w, 8); c.fillRect(0, 16, w, 8); c.fillRect(0, 0, 8, h); c.fillRect(16, 0, 8, h); });
    ging.wrapS = ging.wrapT = THREE.RepeatWrapping; ging.repeat.set(3, 2); ging.magFilter = THREE.NearestFilter;
    const cloth = tmat('#ffffff', { map: ging, rim: 0.12 });
    const cushion = new THREE.Mesh(G.sphere, cloth); cushion.scale.set(0.19, 0.055, 0.19); cushion.position.y = 0.145; basket.add(cushion);
    [0.4, 1.95, 3.5, 5.0].forEach(a => basket.add(part(G.sphere, null, [Math.cos(a) * 0.21, 0.16, Math.sin(a) * 0.21], [0.08, 0.018, 0.065], { mat: cloth, rot: [0, -a, -0.75], ink: 0.012 })));
    egg.root.scale.setScalar(0.62); egg.root.position.y = 0.075; basket.add(egg.root); basket.scale.setScalar(1.15);
    const sparks = [[0.15, 0.44, 0.06], [-0.13, 0.4, 0.09], [0.03, 0.52, -0.05]].map((p, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.sparkTex, color: i % 2 ? '#7ff7ea' : '#fff3a0', transparent: true, depthWrite: false }));
      s.position.set(p[0], p[1], p[2]); s.visible = false; basket.add(s); return s;
    });
    // Noa's letter: cream paper folded in three, her handwriting, with pale gaps where words have gone
    const write = back => canvasTex(128, 168, (c, w, h) => {
      c.fillStyle = '#fbf3df'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(120,90,60,0.22)'; c.fillRect(0, 55, w, 1.5); c.fillRect(0, 111, w, 1.5);
      if (back) { c.globalAlpha = 0.14; c.translate(w, 0); c.scale(-1, 1); }
      c.fillStyle = 'rgba(80,110,170,0.2)'; for (let y = 30; y < h - 10; y += 13) c.fillRect(8, y + 4, w - 16, 1);
      const RL = rng(17); c.strokeStyle = '#3a3150'; c.lineWidth = 1.7; c.lineCap = 'round'; c.lineJoin = 'round';
      for (let y = 26; y < h - 12; y += 13) {
        const end = w - 10 - RL() * 22;
        for (let x = 10; x < end - 8;) {
          const ww = Math.min(6 + RL() * 18, end - x);
          if (RL() < 0.3) { c.fillStyle = 'rgba(150,146,170,0.22)'; c.fillRect(x, y - 2, ww, 4); }
          else { c.beginPath(); for (let k = 0; k <= ww; k += 1.5) { const yy = y + Math.sin(k * 0.9 + x) * 1.8 - (Math.sin(k * 0.37 + x * 3) > 0.8 ? 2.5 : 0); if (k) c.lineTo(x + k, yy); else c.moveTo(x + k, yy); } c.stroke(); }
          x += ww + 4 + RL() * 3;
        }
      }
    });
    const paperM = tmat('#fbf3df', { rim: 0.1 });
    const letter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.31, 0.005), [paperM, paperM, paperM, paperM, tmat('#ffffff', { map: write(false), rim: 0 }), tmat('#ffffff', { map: write(true), rim: 0.1 })]);
    shell(letter, 0.007, 0.24, 0.31, 0.005); letter.visible = false; letter.castShadow = true; hero.torso.add(letter);
    const hand = hero.arms[1].children[1], v = new THREE.Vector3();
    return {
      hero, egg, basket, letter, packs, mouth, brows, sparks,
      Y: { x: 0, ry: 0, z: 0, yaw: 0, speed: 0, phase: 0, onGround: true, land: 1, vy: 0, still: 0, look: 0 },
      // the basket hangs from your left hand and swings with your steps
      hang() { hand.getWorldPosition(v); hero.root.worldToLocal(v); basket.position.set(v.x + 0.02, v.y - 0.405, v.z); basket.rotation.set(Math.sin(HP.phase) * 0.09 * Math.min(1, HP.speed / 3), Math.PI / 2, 0); },
      // the egg wobbles, cutely (k runs 0..1 through it; outside that it sits still), with a little glow and a few sparkles
      wobble(k) {
        const on = k > 0 && k < 1, f = on ? 1 - k : 0;
        egg.wob.rotation.set(on ? Math.sin(k * Math.PI * 2.2 + 0.4) * 0.07 * f : 0, 0, on ? Math.sin(k * Math.PI * 3) * 0.28 * f * f : 0);
        egg.wob.position.y = on ? Math.abs(Math.sin(k * Math.PI * 2)) * 0.03 * f : 0;
        egg.glow.material.opacity = 0.1 + (on ? Math.sin(k * Math.PI) * 0.4 : 0);
        sparks.forEach((s, i) => { const q = (k - 0.2 - i * 0.12) / 0.45; s.visible = q > 0 && q < 1; if (s.visible) { s.scale.setScalar(0.075 * Math.sin(q * Math.PI)); s.material.rotation = q * 2; } });
      },
    };
  }

  // ------------------------------------------------------------ your home station on a spring morning: stone flags over brick, a little station
  // house with a slate roof, a scalloped canopy and a clock, flowers everywhere (the last stop is bare planks and a red shelter)
  function buildStation() {
    const scene = new THREE.Scene(), R = rng(61), TOP = 0.7;
    scene.background = new THREE.Color('#f6e6ca'); scene.fog = new THREE.Fog('#f3e8d2', 70, 330);
    const SUN = new THREE.Vector3(-0.55, 0.5, 0.67).normalize();
    scene.add(skyDome('#7cb4e8', '#fbe8c9', SUN, 0).mesh);
    scene.add(new THREE.HemisphereLight('#dcecff', '#7b8a4c', 0.55));
    const sun = new THREE.DirectionalLight('#ffe3b6', 0.8); sun.target.position.set(1, 0, 3); sun.position.copy(SUN).multiplyScalar(60).add(sun.target.position);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 15, bottom: -15, near: 20, far: 110 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
    {
      const g = new THREE.PlaneGeometry(700, 700, 70, 70); g.rotateX(-Math.PI / 2);
      const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), A = new THREE.Color('#5d9f45'), B = new THREE.Color('#7ab452');
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); c.copy(A).lerp(B, 0.5 + 0.5 * Math.sin(x * 0.07 + Math.cos(z * 0.05) * 2)); col.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const m = new THREE.Mesh(g, toon('#ffffff', { vc: 1, rim: 0 })); m.receiveShadow = true; scene.add(m);
    }
    // the line: ballast, sleepers, rails
    const line = [bare(PB(0, 0.05, 0, 140, 0.1, 3.3, '#a89c8a'))];
    for (let x = -70; x < 70; x += 1.4) line.push(bare(PB(x, 0.12, 0, 0.5, 0.14, 2.6, '#7b5a42')));
    [-0.75, 0.75].forEach(z => line.push(bare(PB(0, 0.25, z, 140, 0.12, 0.12, '#7f828c'))));
    scene.add(solid(line, 0, { rim: 0.1 }));
    // the platform: stone flags on a brick base, a white edge along the line
    const X0 = -15, X1 = 13, Z0 = 1.45, Z1 = 7.4, FLAG = ['#ddd0b8', '#d4c6ac', '#e3d8c3', '#d8caaf', '#cfc0a5'];
    const plat = [PB((X0 + X1) / 2, (TOP - 0.04) / 2, (Z0 + Z1) / 2, X1 - X0, TOP - 0.04, Z1 - Z0, '#a8987f'), bare(PB((X0 + X1) / 2, (TOP - 0.04) / 2, Z1 + 0.012, X1 - X0, TOP - 0.04, 0.03, '#b8735a'))];
    for (let x = X0 + 0.04; x + 1.2 <= X1; x += 1.24) for (let z = Z0 + 0.32; z + 0.9 <= Z1; z += 0.94) plat.push(bare(PB(x + 0.6, TOP - 0.02, z + 0.45, 1.2, 0.04, 0.9, FLAG[(R() * FLAG.length) | 0])));
    plat.push(bare(PB((X0 + X1) / 2, TOP - 0.015, Z0 + 0.14, X1 - X0, 0.04, 0.26, '#f6f0e1')));
    scene.add(solid(plat, 0.03, { rim: 0.06 }));
    // the station house: plaster and timber, a slate roof, a green door, a window box
    const HX = 9.4, HZ = 5.75, HW = 4.4, HD = 2.8, HH = 2.5, FZ = HZ - HD / 2, EAVE = TOP + HH + 0.12;
    const CREAM = '#f5e8cd', TIMBER = '#8a5f3e', SLATE = '#5d7799', IRONG = '#2f5a48', WHITE = '#f7f2e6', SLOPE = Math.atan2(1.0, HD / 2);
    scene.add(solid([
      PB(HX, TOP + HH / 2, HZ, HW, HH, HD, CREAM), bare(PB(HX, TOP + 0.16, HZ, HW + 0.08, 0.32, HD + 0.08, '#bfae96')),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => PB(HX + a * HW / 2, TOP + HH / 2, HZ + b * HD / 2, 0.16, HH, 0.16, TIMBER)),
      PB(HX, TOP + HH + 0.06, HZ, HW + 0.1, 0.12, HD + 0.1, TIMBER),
      { geo: PRISM(), color: CREAM, m: M4(HX, EAVE + 1 / 3, HZ, HW, 1.0, HD), hm: k => M4(HX, EAVE + 1 / 3, HZ, HW + 2 * k, 1.0 + 2 * k, HD + 2 * k) },
      ...[-1, 1].map(s => PB(HX, EAVE + 0.5 + 0.02, HZ + s * (HD / 4 + 0.08), HW + 0.5, 0.13, Math.hypot(HD / 2, 1.0) + 0.42, SLATE, 0, s * SLOPE)),
      PB(HX + 1.2, EAVE + 1.0, HZ + 0.45, 0.42, 1.0, 0.42, '#a1574a'),
      PB(HX - 1.1, TOP + 0.9, FZ - 0.03, 0.86, 1.8, 0.07, '#3e7a58'), PB(HX - 1.1, TOP + 1.42, FZ - 0.07, 0.4, 0.34, 0.02, '#a8e1f0'), PB(HX - 0.78, TOP + 0.9, FZ - 0.09, 0.07, 0.07, 0.05, '#d9a441'),
      PB(HX + 0.9, TOP + 1.5, FZ - 0.03, 1.0, 0.82, 0.06, '#a8e1f0'), PB(HX + 0.9, TOP + 1.5, FZ - 0.07, 1.08, 0.07, 0.03, WHITE), PB(HX + 0.9, TOP + 1.5, FZ - 0.07, 0.07, 0.9, 0.03, WHITE),
      PB(HX + 0.9, TOP + 1.0, FZ - 0.18, 1.2, 0.2, 0.3, '#9a6a43'),
    ], 0.035, { rim: 0.12 }));
    // a canopy over the platform with a scalloped edge, on two cast-iron posts; a clock hanging from it
    const CZ = FZ - 1.95, CY = TOP + 2.45, SCALLOP = shape('scallop', () => new THREE.CylinderGeometry(1, 1, 1, 10, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2));
    const can = [PB(HX, CY + 0.1, (FZ + CZ) / 2, HW + 0.6, 0.1, FZ - CZ + 0.15, SLATE, 0, -0.08)];
    [HX - HW / 2 + 0.15, HX + HW / 2 - 0.15].forEach(x => can.push(PC(x, TOP + 1.2, CZ + 0.18, 0.065, 2.4, IRONG), PC(x, TOP + 0.08, CZ + 0.18, 0.13, 0.16, IRONG), PB(x, CY - 0.2, CZ + 0.5, 0.06, 0.06, 0.75, IRONG, 0, 0.62)));
    for (let x = HX - HW / 2 - 0.15; x <= HX + HW / 2 + 0.2; x += 0.44) can.push({ geo: SCALLOP, color: WHITE, m: M4(x, CY + 0.05, CZ - 0.02, 0.22, 0.22, 0.03), hm: k => M4(x, CY + 0.05, CZ - 0.02, 0.22 + k, 0.22 + k, 0.03 + 2 * k) });
    scene.add(solid(can, 0.03, { rim: 0.12 }));
    const dial = canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#fbf7ec'; c.beginPath(); c.arc(64, 64, 60, 0, TAU); c.fill();
      c.strokeStyle = INK; c.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 48 : 42; c.lineWidth = i % 3 ? 3 : 5; c.beginPath(); c.moveTo(64 + Math.sin(a) * r0, 64 - Math.cos(a) * r0); c.lineTo(64 + Math.sin(a) * 54, 64 - Math.cos(a) * 54); c.stroke(); }
      const hand = (a, r, lw) => { c.lineWidth = lw; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.sin(a) * r, 64 - Math.cos(a) * r); c.stroke(); };
      hand((8 + 5 / 60) / 12 * TAU, 30, 6); hand(5 / 60 * TAU, 44, 4);   // a little past eight in the morning
      c.fillStyle = INK; c.beginPath(); c.arc(64, 64, 5, 0, TAU); c.fill();
    });
    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 24), [toon(IRONG, { rim: 0.2 }), tmat('#ffffff', { map: dial, rim: 0 }), tmat('#ffffff', { map: dial, rim: 0 })]);
    clock.rotation.set(0, 0, Math.PI / 2); clock.position.set(HX - HW / 2 + 0.55, CY - 0.5, CZ + 0.62); shell(clock, 0.02, 0.6, 0.1, 0.6); clock.castShadow = true; scene.add(clock);
    scene.add(solid([PB(HX - HW / 2 + 0.55, CY - 0.12, CZ + 0.62, 0.05, 0.42, 0.05, IRONG)], 0.015));
    // a bench facing the line, a lamp post, planters full of flowers, a low white fence at the back
    const props = [], BX = 3.9, BZ = 6.55, LX = 6.35, LZ = 6.75, FL = ['#ff8fb1', '#ffd84a', '#fff8ec', '#ff7a5c', '#b79be8'];
    for (let i = 0; i < 3; i++) props.push(PB(BX, TOP + 0.45, BZ - 0.13 + i * 0.13, 1.8, 0.05, 0.11, '#b5794a'));
    for (let i = 0; i < 2; i++) props.push(PB(BX, TOP + 0.74 + i * 0.17, BZ + 0.27 + i * 0.03, 1.8, 0.11, 0.05, '#b5794a', 0, -0.15));
    [-0.8, 0.8].forEach(dx => props.push(PB(BX + dx, TOP + 0.24, BZ, 0.07, 0.48, 0.48, IRONG), PB(BX + dx, TOP + 0.7, BZ + 0.29, 0.07, 0.62, 0.07, IRONG, 0, -0.15), PB(BX + dx, TOP + 0.56, BZ - 0.04, 0.07, 0.05, 0.56, IRONG)));
    props.push(PC(LX, TOP + 0.12, LZ, 0.16, 0.24, IRONG), PC(LX, TOP + 1.6, LZ, 0.06, 3.0, IRONG), PB(LX, TOP + 3.12, LZ, 0.34, 0.06, 0.34, IRONG), bare(PB(LX, TOP + 3.35, LZ, 0.26, 0.38, 0.26, '#fff1c8')),
      PB(LX, TOP + 3.57, LZ, 0.4, 0.07, 0.4, IRONG), PC(LX, TOP + 3.72, LZ, 0.14, 0.22, IRONG, 0, 0, 0, G.cone));
    const planter = (x, z, w) => {
      props.push(PB(x, TOP + 0.22, z, w, 0.44, 0.46, '#9a6a43'), bare(PB(x, TOP + 0.445, z, w - 0.08, 0.02, 0.38, '#5b3d2a')));
      for (let i = 0; i < w * 4; i++) props.push(bare(PS(x - w / 2 + 0.16 + R() * (w - 0.32), TOP + 0.5 + R() * 0.08, z + (R() - 0.5) * 0.26, 0.14, 0.11, 0.14, R() < 0.5 ? '#4f9a3e' : '#5fae48', G.ico1)));
      for (let i = 0; i < w * 6; i++) props.push(Object.assign(PS(x - w / 2 + 0.12 + R() * (w - 0.24), TOP + 0.6 + R() * 0.12, z + (R() - 0.5) * 0.3, 0.055, 0.045, 0.055, FL[(R() * FL.length) | 0], G.ico1), { k: 0.01 }));
    };
    planter(-0.2, 6.9, 1.3); planter(-3.6, 6.9, 1.3); planter(1.9, 6.9, 0.9); planter(-7.4, 6.9, 1.3);
    for (let x = X0 + 0.3; x < HX - HW / 2 - 0.2; x += 0.3) props.push(PB(x, TOP + 0.24, Z1 - 0.12, 0.07, 0.48, 0.05, WHITE));
    [0.16, 0.38].forEach(y => props.push(PB((X0 + HX - HW / 2) / 2, TOP + y, Z1 - 0.15, HX - HW / 2 - X0 - 0.3, 0.05, 0.03, WHITE)));
    scene.add(solid(props, 0.022, { rim: 0.15 }));
    // a hanging basket of flowers on the canopy, and the window box's flowers
    const blooms = [];
    for (let i = 0; i < 9; i++) blooms.push(Object.assign(PS(HX + 0.9 + (R() - 0.5) * 1.0, TOP + 1.16 + R() * 0.08, FZ - 0.2 + (R() - 0.5) * 0.18, 0.06, 0.05, 0.06, FL[i % FL.length], G.ico1), { k: 0.01 }));
    for (let i = 0; i < 6; i++) blooms.push(bare(PS(HX + 0.9 + (R() - 0.5) * 1.0, TOP + 1.12, FZ - 0.2 + (R() - 0.5) * 0.15, 0.12, 0.09, 0.1, '#55a346', G.ico1)));
    blooms.push(PS(HX + 1.5, CY - 0.45, CZ + 0.3, 0.26, 0.22, 0.26, '#5aa84a', G.ico1), PC(HX + 1.5, CY - 0.18, CZ + 0.3, 0.012, 0.36, IRONG));
    for (let i = 0; i < 10; i++) { const a = R() * TAU, y = R(); blooms.push(Object.assign(PS(HX + 1.5 + Math.cos(a) * 0.24, CY - 0.45 - y * 0.18 + 0.1, CZ + 0.3 + Math.sin(a) * 0.24, 0.06, 0.05, 0.06, FL[i % FL.length], G.ico1), { k: 0.01 })); }
    scene.add(solid(blooms, 0.018, { rim: 0.18 }));
    // trees, hills and clouds; the far side of the line is open meadow
    const trees = [];
    for (let i = 0; i < 30; i++) trees.push({ x: -30 + R() * 90, y: -0.1, z: -15 - Math.pow(R(), 0.7) * 50, s: 0.9 + R() * 0.6, ry: R() * TAU, tint: 0.86 + R() * 0.24 });
    for (let i = 0; i < 12; i++) trees.push({ x: 15 + R() * 26, y: -0.1, z: 1 + R() * 26, s: 0.9 + R() * 0.6, ry: R() * TAU, tint: 0.86 + R() * 0.24 });
    scene.add(many(ROUND(), toon('#ffffff', { vc: 1, rim: 0.22 }), trees, { shadow: true, receive: true }));
    const hills = [];
    for (let i = 0; i < 16; i++) hills.push({ x: -70 + i * 13 + R() * 8, y: -0.5, z: -78 - R() * 70, sx: 22 + R() * 18, sy: 8 + R() * 9, sz: 16 + R() * 10, tint: ['#86bb69', '#94c477', '#7fb267', '#a3c98a'][i % 4] });
    scene.add(many(HILL(), toon('#ffffff', { vc: 1, rim: 0 }), hills));
    const clouds = [];
    for (let i = 0; i < 7; i++) clouds.push({ x: -60 + i * 32 + R() * 14, y: 42 + R() * 20, z: -170 - R() * 80, s: 8 + R() * 6, ry: R() });
    scene.add(many(CLOUD(), tmat('#ffffff', { vc: true, rim: 0.3, fog: false }), clouds));
    // the train, waiting, steam puffing from its stack
    const train = buildTrain(); train.g.position.set(0, 0.1, 0); scene.add(train.g);
    const steam = steamer(scene); train.g.updateMatrixWorld(true); steam.at.set(5.2 + 1.8, 3.95, 0); train.g.localToWorld(steam.at);
    // your walk: out of the station house, along the platform (a brisk walk that slows by the door), a turn, the step up, and in
    const path = new THREE.CatmullRomCurve3([[8.0, 3.6], [6.8, 2.8], [4.8, 2.5], [2.4, 2.44], [0, 2.44]].map(([x, z]) => new THREE.Vector3(x, TOP, z)));
    const PLEN = path.getLength(), V = 3.3, TB = 0.6, TA = (PLEN - V * TB / 2) / V, at = new THREE.Vector3(), tan = new THREE.Vector3();
    function walk(lt, P) {
      const e = clamp(lt - TA, 0, TB), d = lt < TA ? V * lt : V * TA + V * e - V / (2 * TB) * e * e, v = lt < TA ? V : V * (1 - e / TB);
      const u = clamp(d / PLEN, 0, 1); path.getPointAt(u, at); path.getTangentAt(Math.min(u, 0.995), tan);
      const head = Math.atan2(tan.x, tan.z), turn = span(lt, 2.45, 2.95), up = span(lt, 2.9, 3.35), inn = span(lt, 3.35, 4.0);
      const step = lt > 2.9;
      Object.assign(P, {
        x: at.x, z: step ? lerp(2.44, 1.42, up) - 1.25 * inn : at.z, y: step ? TOP + 0.22 * up + Math.sin(up * Math.PI) * 0.12 : TOP,
        yaw: head + angDiff(head, Math.PI) * turn, speed: step ? 3.2 : v * 1.5, phase: 3.4 * lt + 2.175 * (d + 1.3 * (1.02 * up + 1.25 * inn)),
        sit: 0, arms: 'carry', read: 0, look: 0, pitch: 0, worry: 0, kick: 0, lids: 0, lean: 0, glum: 0,
      });
    }
    function update(t, dt) { steam.update(dt); }
    function reset() { steam.clear(); steam.rate = 0.55; for (let i = 0; i < 90; i++) steam.update(1 / 30); }
    return { scene, train, steam, walk, update, reset };
  }

  // ------------------------------------------------------------ the compartment, and the land going by outside its window
  // Two passes: the outside first (its own sky, sun and haze), then the compartment over it, so the land is
  // seen through the window, and the haze of the north can close in out there without graying the room.
  const CW = 1.6, CD = 1.25, CH = 2.62, WX = 0.82, WY0 = 0.86, WY1 = 2.08;   // the room's half length and half width, its height; the window
  const HERO_AT = new THREE.Vector3(-1.03, 0.22, -0.6), BASKET_AT = new THREE.Vector3(-1.12, 0.52, 0.22);
  function buildCompartment() {
    const scene = new THREE.Scene(), out = new THREE.Scene(), car = new THREE.Group(), R = rng(23);
    scene.userData.under = out; scene.add(car);
    const WOOD = '#8d5b3b', DARK = '#6b412b', CREAM = '#f3e6cb', SEAT = '#9a3c40', BRASS = '#d6a446', CURT = '#3f8a80', LACE = '#f8f3e7';
    // walls (wood below, cream above) with the window in the outer one, ceiling, floor, a rug
    car.add(solid([
      PB(0, WY0 / 2, -CD - 0.06, 2 * CW, WY0, 0.12, WOOD),
      ...[-1, 1].map(s => PB(s * (CW + WX) / 2, (WY0 + WY1) / 2, -CD - 0.06, CW - WX, WY1 - WY0, 0.12, CREAM)),
      PB(0, (WY1 + CH) / 2, -CD - 0.06, 2 * CW, CH - WY1, 0.12, CREAM),
      ...[-1, 1].flatMap(s => [PB(s * (CW + 0.06), WY0 / 2, 0, 0.12, WY0, 2 * CD, WOOD), PB(s * (CW + 0.06), (WY0 + CH) / 2, 0, 0.12, CH - WY0, 2 * CD, CREAM)]),
      PB(0, CH + 0.06, 0, 2 * CW + 0.24, 0.12, 2 * CD + 0.24, '#f7eedb'), PB(0, -0.05, 0, 2 * CW + 0.24, 0.1, 2 * CD + 0.24, '#6a4532'),
      ...[-1, 1].flatMap(s => [bare(PB(s * (CW - 0.015), WY0, 0, 0.03, 0.05, 2 * CD, DARK)), bare(PB(s * (CW - 0.025), CH - 0.04, 0, 0.05, 0.08, 2 * CD, DARK))]),
      bare(PB(0, CH - 0.04, -CD + 0.025, 2 * CW, 0.08, 0.05, DARK)),
      bare(PB(0, 0.012, 0, 1.68, 0.024, 2 * CD - 0.2, BRASS)), bare(PB(0, 0.026, 0, 1.5, 0.024, 2 * CD - 0.38, '#a63e3a')),
    ], 0.012, { rim: 0.05 }));
    // the corridor wall: the wide shot looks in from behind it (a stage with its fourth wall taken away), so it can hide
    const front = solid([PB(0, WY0 / 2, CD + 0.06, 2 * CW, WY0, 0.12, WOOD), PB(0, (WY0 + CH) / 2, CD + 0.06, 2 * CW, CH - WY0, 0.12, CREAM),
      bare(PB(0, WY0, CD - 0.015, 2 * CW, 0.05, 0.03, DARK)), bare(PB(0, CH - 0.04, CD - 0.025, 2 * CW, 0.08, 0.05, DARK))], 0.012, { rim: 0.05 });
    car.add(front);
    // the window: a wooden frame, the lowered sash, a little table with your tea and Noa's envelopes
    car.add(solid([
      ...[-1, 1].map(s => PB(s * (WX + 0.035), (WY0 + WY1) / 2, -CD + 0.02, 0.07, WY1 - WY0 + 0.07, 0.09, WOOD)),
      PB(0, WY1 + 0.035, -CD + 0.02, 2 * WX + 0.14, 0.07, 0.09, WOOD), PB(0, WY1 - 0.4, -CD - 0.06, 2 * WX, 0.05, 0.05, WOOD),
      PB(0, WY0 + 0.01, -CD + 0.14, 2 * WX + 0.3, 0.05, 0.32, WOOD), ...[-0.55, 0.55].map(x => PB(x, WY0 - 0.12, -CD + 0.05, 0.04, 0.2, 0.12, BRASS)),
      PC(-0.42, WY0 + 0.08, -CD + 0.17, 0.05, 0.09, '#f8f4ea'), bare(PC(-0.42, WY0 + 0.095, -CD + 0.17, 0.052, 0.018, CURT)), bare(PC(-0.42, WY0 + 0.122, -CD + 0.17, 0.044, 0.004, '#8a5530')),
      PC(-0.42, WY0 + 0.042, -CD + 0.17, 0.085, 0.012, '#f8f4ea'),
      PB(0.22, WY0 + 0.042, -CD + 0.15, 0.24, 0.012, 0.16, '#f4ecd6', 0.18), PB(0.25, WY0 + 0.055, -CD + 0.16, 0.24, 0.012, 0.16, '#efe4c8', -0.12), bare(PB(0.33, WY0 + 0.062, -CD + 0.13, 0.04, 0.004, 0.05, '#d0463d', -0.12)),
    ], 0.012, { rim: 0.12 }));
    car.add(part(new THREE.TorusGeometry(0.026, 0.008, 6, 12), '#f8f4ea', [-0.42 + 0.056, WY0 + 0.085, -CD + 0.17], null, { ink: 0.005 }));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2 * WX, 0.4), new THREE.MeshBasicMaterial({ color: '#d4ecf5', transparent: true, opacity: 0.14, depthWrite: false }));
    glass.position.set(0, WY1 - 0.2, -CD - 0.07); car.add(glass);
    // curtains tied back on both sides, under a valance
    const drape = shape('drape', () => lathe([[0, -0.62], [0.12, -0.6], [0.1, -0.46], [0.05, -0.18], [0.08, 0.04], [0.13, 0.34], [0.15, 0.59], [0, 0.62]], 12));
    const curt = [PB(0, WY1 + 0.12, -CD + 0.08, 2 * WX + 0.55, 0.14, 0.09, CURT)];
    [-1, 1].forEach(s => { const x = s * (WX + 0.17); curt.push({ geo: drape, color: CURT, m: M4(x, 1.46, -CD + 0.1, 1, 1, 0.45), hm: k => M4(x, 1.46, -CD + 0.1, 1 + k / 0.15, 1 + k / 0.62, 0.45 + k / 0.33) }, PC(x, 1.28, -CD + 0.1, 0.062, 0.05, '#e0b04a', 0, 0, 0, shape('cyl10', () => new THREE.CylinderGeometry(1, 1, 1, 10)))); });
    car.add(solid(curt, 0.012, { rim: 0.15 }));
    // the benches: wooden bases, red cushions, a headrest roll, lace where heads go
    const seats = [];
    [-1, 1].forEach(s => seats.push(
      PB(s * 1.25, 0.2, 0, 0.64, 0.4, 2 * CD - 0.04, DARK), PB(s * 1.2, 0.45, 0, 0.66, 0.14, 2 * CD - 0.12, SEAT),
      PB(s * 1.47, 1.0, 0, 0.14, 0.92, 2 * CD - 0.12, SEAT, 0, 0, -s * 0.06), PC(s * 1.5, 1.5, 0, 0.09, 2 * CD - 0.12, SEAT, 0, Math.PI / 2),
      bare(PB(s * 1.565, 1.02, 0, 0.05, 1.25, 2 * CD - 0.04, WOOD)),
      ...(s < 0 ? [-0.6] : [-0.6, 0.45]).map(z => bare(PB(s * 1.392, 1.24, z, 0.015, 0.28, 0.4, LACE, 0, 0, -s * 0.06)))));
    car.add(solid(seats, 0.014, { rim: 0.12 }));
    // brass luggage racks: your backpack and bedroll on one, somebody's little suitcase on the other; two wall lamps
    const rack = [];
    [-1, 1].forEach(s => {
      rack.push(PC(s * 1.14, 2.2, 0, 0.018, 2 * CD - 0.2, BRASS, 0, Math.PI / 2), PC(s * 1.5, 2.2, 0, 0.018, 2 * CD - 0.2, BRASS, 0, Math.PI / 2), bare(PB(s * 1.32, 2.19, 0, 0.36, 0.012, 2 * CD - 0.24, '#7a6248')));
      [-0.9, 0, 0.9].forEach(z => rack.push(PB(s * 1.32, 2.2, z, 0.4, 0.025, 0.025, BRASS), PB(s * 1.52, 2.12, z, 0.025, 0.18, 0.025, BRASS)));
      rack.push(PB(s * (CW - 0.03), 1.82, -0.9, 0.05, 0.16, 0.1, BRASS), PC(s * (CW - 0.1), 1.84, -0.9, 0.02, 0.14, BRASS, 0, 0, Math.PI / 2));
    });
    rack.push(PB(-1.3, 2.33, -0.52, 0.34, 0.24, 0.4, '#a8673a'), PB(-1.3, 2.3, -0.31, 0.22, 0.12, 0.03, '#8d5530'), PC(-1.3, 2.31, 0.08, 0.1, 0.48, '#ead9b2', 0, Math.PI / 2));
    rack.push(PB(1.3, 2.32, 0.35, 0.3, 0.22, 0.58, '#6f8fc0'), PB(1.3, 2.45, 0.35, 0.06, 0.04, 0.16, '#3d4466'));
    car.add(solid(rack, 0.01, { rim: 0.2 }));
    const shadeM = new THREE.MeshBasicMaterial({ color: '#ffe8b5', side: THREE.DoubleSide }), shadeG = new THREE.SphereGeometry(0.1, 14, 7, 0, TAU, 0, Math.PI * 0.62);
    [-1, 1].forEach(s => {
      const m = new THREE.Mesh(shadeG, shadeM); m.position.set(s * (CW - 0.17), 1.84, -0.9); shell(m, 0.008, 0.2, 0.2, 0.2); car.add(m);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffcf7a', transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
      gl.position.set(s * (CW - 0.2), 1.8, -0.9); gl.scale.setScalar(0.6); car.add(gl);
    });
    // light: warm room light, a lamp, and the sun coming in through the window (the walls throw its shape on the seats)
    const hemi = new THREE.HemisphereLight('#fff3df', '#86634d', 0.6); scene.add(hemi);
    const lamp = new THREE.PointLight('#ffd08a', 0.45, 6, 1.2); lamp.position.set(0, 2.15, -0.2); car.add(lamp);
    const winL = new THREE.DirectionalLight('#fff2d4', 0.62); winL.position.set(2.5, 7.0, -5.5); winL.target.position.set(-0.8, 0.5, -0.3);
    winL.castShadow = true; winL.shadow.mapSize.set(1024, 1024); Object.assign(winL.shadow.camera, { left: -2.8, right: 2.8, top: 2.8, bottom: -2.8, near: 1, far: 16 });
    winL.shadow.bias = -0.0015; winL.shadow.normalBias = 0.02; scene.add(winL, winL.target);

    // ---- outside: a sky and sun of its own, the ground, and rows of things going by (each row wraps around)
    const DAY_TOP = new THREE.Color('#6caee9'), DAY_HOR = new THREE.Color('#e2efe8'), HZ_TOP = new THREE.Color('#8b8a99'), HZ_HOR = new THREE.Color('#aaa8b4');
    const sky = skyDome(DAY_TOP, DAY_HOR, new THREE.Vector3(0, 1, 0), 0); out.add(sky.mesh);
    out.fog = new THREE.Fog(DAY_HOR.clone(), 60, 340);
    const hemiO = new THREE.HemisphereLight('#d7ecff', '#5d7040', 0.55), sunO = new THREE.DirectionalLight('#fff0d2', 0.72); sunO.position.set(30, 60, 45); out.add(hemiO, sunO);
    const GY = -1.12, ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 700), drained(tmat('#77b050', { rim: 0 })));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, GY, -350); out.add(ground);
    const lanes = [], laneMat = (rim, fog = true) => drained(tmat('#ffffff', { vc: true, rim, fog }));
    function lane(g, L, items, o = {}) {
      const im = many(g, o.mat || laneMat(o.rim === undefined ? 0.15 : o.rim, o.fog), items); out.add(im);
      lanes.push({ im, L, xs: items.map(t => t.x) });
      if (o.hull) { const h = new THREE.InstancedMesh(o.hull, shellMat(o.fog !== false), items.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; out.add(h); }
      return im;
    }
    const hullOf = (pieces, k) => merge(pieces.map(p => ({ geo: p.geo, m: p.hm(k), color: INK })));
    // telegraph poles close by (they flick past), wires sagging from one to the next
    const GAP = 11, poleP = [PC(0, (GY + 3.3) / 2, 0, 0.085, 3.3 - GY, '#7a5b42', 0, 0, 0, shape('cyl8', () => new THREE.CylinderGeometry(1, 1, 1, 8))), PB(0, 2.9, 0, 1.15, 0.09, 0.09, '#6d503a'),
      ...[-0.48, 0.48].map(x => PC(x, 2.98, 0, 0.035, 0.09, '#eef3f5')), PC(0, 3.34, 0, 0.035, 0.09, '#eef3f5')];
    const wires = [[-0.48, 3.02], [0.48, 3.02], [0, 3.38]].map(([x, y]) => ({ geo: new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, y, 0), new THREE.Vector3(x + GAP / 2, y - 0.95, 0), new THREE.Vector3(x + GAP, y, 0)), 14, 0.013, 3), m: M4(0, 0, 0, 1), color: INK }));
    lane(merge(poleP.concat(wires)), GAP * 6, Array.from({ length: 6 }, (_, i) => ({ x: GAP * (i - 2.5), z: -6.2, tint: 0.9 + R() * 0.12 })), { rim: 0.2, hull: hullOf(poleP, 0.025) });
    // a patchwork of fields (some plowed or with wheat in rows), hedges and trees between them, bales, a flock of sheep, farmhouses
    const FL = 180, PAT = ['#7dbb57', '#93c962', '#69aa4c', '#e1c46a', '#eedb5c', '#b5895c', '#86c05e', '#7dbb57'];
    const patches = [], rows = [], hedges = [], trees = [], bales = [], flock = [], farms = [];
    [[-3.4, -9.6], [-9.6, -17.5], [-17.5, -27.5], [-27.5, -42], [-42, -62]].forEach(([n, f], b) => {
      for (let x = -FL / 2; x < FL / 2 - 3;) {
        const len = Math.min(7 + R() * 15, FL / 2 - x), cx = x + len / 2, cz = (n + f) / 2, d = n - f, col = PAT[(R() * PAT.length) | 0];
        patches.push({ x: cx, y: GY + 0.02, z: cz, sx: len - 0.8, sy: 0.05, sz: d - 0.8, tint: col });
        if (col === '#e1c46a' || col === '#b5895c') {
          const dark = col === '#b5895c' ? '#97704a' : '#cdaa55';
          if (R() < 0.5) for (let k = 0.6; k < len - 1; k += 0.8) rows.push({ x: x + k + 0.4, y: GY + 0.05, z: cz, sx: 0.24, sy: 0.05, sz: d - 1.3, tint: dark });
          else for (let k = 0.6; k < d - 1; k += 0.8) rows.push({ x: cx, y: GY + 0.05, z: f + k + 0.4, sx: len - 1.3, sy: 0.05, sz: 0.24, tint: dark });
        }
        if (b > 0 && R() < 0.55) for (let z = f + 0.6; z < n - 0.4; z += 1.5) hedges.push({ x: x + len + (R() - 0.5) * 0.2, y: GY + 0.35, z, sx: 0.9 + R() * 0.3, sy: 0.7 + R() * 0.25, sz: 0.85, ry: R() * 3, tint: R() < 0.5 ? '#4b8f3c' : '#58a046' });
        if (b > 0 && R() < 0.45) trees.push({ x: x + len, y: GY - 0.1, z: lerp(f, n, 0.2 + R() * 0.6), s: 0.9 + R() * 0.55, ry: R() * TAU, tint: 0.86 + R() * 0.24 });
        if (col === '#e1c46a' && b > 0 && b < 4 && bales.length < 9) for (let k = 0; k < 3; k++) bales.push({ x: x + 2 + R() * (len - 4), y: GY + 0.5, z: lerp(f, n, 0.25 + R() * 0.5), ry: R() * 3 });
        if ((col === '#93c962' || col === '#7dbb57') && b === 2 && !flock.length) for (let k = 0; k < 6; k++) flock.push({ x: cx + (R() - 0.5) * (len - 3), y: GY + 0.05, z: lerp(f, n, 0.2 + R() * 0.6), ry: R() * TAU, s: 0.9 + R() * 0.2 });
        if (b === 3 && farms.length < 2 && R() < 0.3) farms.push({ x: cx, y: GY + 0.03, z: lerp(f, n, 0.5), ry: (R() - 0.5) * 0.8 });
        x += len;
      }
    });
    for (let i = 0; i < 46; i++) trees.push({ x: -FL / 2 + R() * FL, y: GY - 0.2, z: -46 - Math.pow(R(), 0.8) * 34, s: 1.1 + R() * 0.8, ry: R() * TAU, tint: 0.82 + R() * 0.25 });
    const box1 = shape('box1', () => merge([{ geo: G.box, m: M4(0, 0, 0, 1), color: '#ffffff' }]));
    lane(box1, FL, patches, { rim: 0 }); lane(box1, FL, rows, { rim: 0 });
    lane(shape('blob', () => merge([{ geo: G.ico1, m: M4(0, 0, 0, 1), color: '#ffffff' }])), FL, hedges, { rim: 0.2 });
    lane(ROUND(), FL, trees, { rim: 0.22 });
    const baleP = [PC(0, 0, 0, 0.5, 0.9, '#e4c25f', 0, Math.PI / 2), bare(PC(0, 0, 0.452, 0.42, 0.01, '#caa64c', 0, Math.PI / 2)), bare(PC(0, 0, -0.452, 0.42, 0.01, '#caa64c', 0, Math.PI / 2))];
    if (bales.length) lane(merge(baleP), FL, bales, { rim: 0.2, hull: hullOf(baleP.slice(0, 1), 0.035) });
    const sheepP = [PS(0, 0.42, 0, 0.42, 0.3, 0.3, '#f7f4ec', G.ico1), PS(0.38, 0.52, 0, 0.13, 0.13, 0.12, '#3e3642'), ...[[-0.2, -0.13], [-0.2, 0.13], [0.2, -0.13], [0.2, 0.13]].map(([x, z]) => PC(x, 0.14, z, 0.035, 0.28, '#3e3642'))];
    if (flock.length) lane(merge(sheepP), FL, flock, { rim: 0.25, hull: hullOf(sheepP, 0.03) });
    const farmP = [PB(0, 0.85, 0, 2.6, 1.7, 2.0, '#f3e6c9'), { geo: PRISM(), color: '#f3e6c9', m: M4(0, 1.7 + 0.9 / 3, 0, 2.6, 0.9, 2.0), hm: k => M4(0, 1.7 + 0.9 / 3, 0, 2.6 + 2 * k, 0.9 + 2 * k, 2.0 + 2 * k) },
      ...[-1, 1].map(s => PB(0, 1.7 + 0.47, s * 0.52, 3.0, 0.12, Math.hypot(1.0, 0.9) + 0.3, '#c9553f', 0, s * Math.atan2(0.9, 1.0))), PB(0.8, 2.55, -0.3, 0.3, 0.7, 0.3, '#a1574a'),
      PB(-0.5, 0.55, 1.01, 0.5, 1.0, 0.04, '#7a4b2c'), PB(0.6, 1.05, 1.01, 0.55, 0.45, 0.04, '#a8e1f0')];
    if (farms.length) lane(merge(farmP), FL, farms, { rim: 0.2, hull: hullOf(farmP, 0.06) });
    // rolling hills, far blue mountains, clouds
    const HL = 560, hills = [];
    for (let i = 0; i < 22; i++) hills.push({ x: -HL / 2 + (i + R() * 0.6) * HL / 22, y: GY - 0.5, z: -72 - R() * 60, sx: 20 + R() * 22, sy: 7 + R() * 9, sz: 14 + R() * 10, tint: ['#88bb6a', '#97c579', '#7fb267', '#a2c88a'][i % 4] });
    lane(HILL(), HL, hills, { rim: 0 });
    const ML = 1400, peaks = [];
    for (let i = 0; i < 18; i++) { const sy = 30 + R() * 35; peaks.push({ x: -ML / 2 + (i + R() * 0.7) * ML / 18, y: GY + sy / 2 - 4, z: -210 - R() * 80, sx: 45 + R() * 40, sy, sz: 40, tint: ['#9db8c4', '#a9c1cc', '#93b0bf'][i % 3] }); }
    lane(shape('peak', () => merge([{ geo: new THREE.ConeGeometry(1, 1, 7), m: M4(0, 0, 0, 1), color: '#ffffff' }])), ML, peaks, { rim: 0 });
    const cl = [];
    for (let i = 0; i < 9; i++) cl.push({ x: -ML / 2 + (i + R() * 0.6) * ML / 9, y: 34 + R() * 26, z: -190 - R() * 90, s: 9 + R() * 6, ry: R() });
    lane(CLOUD(), ML, cl, { rim: 0.3, fog: false });
    // the haze of the north: soft gray mist low over the fields, and motes in the air (both only show as the color goes)
    const mistM = new THREE.SpriteMaterial({ map: puffTex, color: '#bbb9c4', transparent: true, opacity: 0, depthWrite: false });
    const mist = Array.from({ length: 26 }, () => { const s = new THREE.Sprite(mistM); s.userData = { x: (R() - 0.5) * 140, y: GY + 0.6 + R() * 3.4, z: -7 - R() * 45 }; s.scale.set(9 + R() * 9, 3 + R() * 3, 1); out.add(s); return s; });
    const motes = (() => {
      const n = 70, pos = new Float32Array(n * 3), seeds = [];
      for (let i = 0; i < n; i++) seeds.push({ x: (R() - 0.5) * 60, y: GY + 0.4 + R() * 5, z: -3 - R() * 16, ph: R() * 9 });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#8f8aa3', size: 0.14, map: glowTex, transparent: true, opacity: 0, depthWrite: false }));
      pts.frustumCulled = false; out.add(pts); return { pos, seeds, g, pts };
    })();
    const wrap = (x, L) => { x %= L; return x < -L / 2 ? x + L : x >= L / 2 ? x - L : x; };
    function scroll(s, t) {
      for (const ln of lanes) {
        const a = ln.im.instanceMatrix.array;
        for (let i = 0; i < ln.xs.length; i++) a[i * 16 + 12] = wrap(ln.xs[i] - s, ln.L);
        ln.im.instanceMatrix.needsUpdate = true;
      }
      mist.forEach(m => m.position.set(wrap(m.userData.x - s, 140), m.userData.y, m.userData.z));
      motes.seeds.forEach((q, i) => { motes.pos[i * 3] = wrap(q.x - s * 0.96, 60); motes.pos[i * 3 + 1] = q.y + Math.sin(t * 0.7 + q.ph) * 0.3; motes.pos[i * 3 + 2] = q.z + Math.cos(t * 0.5 + q.ph) * 0.3; });
      motes.g.attributes.position.needsUpdate = true;
    }
    // the mood: 0 a bright morning, 1 the gray north (the room keeps its lamps)
    const mood = { g: 0, target: 0 }, C = c => new THREE.Color(c);
    const SUN_D = C('#fff0d2'), SUN_G = C('#c8c7d3'), WIN_D = C('#fff2d4'), WIN_G = C('#c9cbd8'), HEMI_D = C('#fff3df'), HEMI_G = C('#ddd9de');
    function applyMood(g) {
      GRAY.value = g * 0.92;
      sky.u.uTop.value.copy(DAY_TOP).lerp(HZ_TOP, g); sky.u.uHor.value.copy(DAY_HOR).lerp(HZ_HOR, g);
      out.fog.color.copy(sky.u.uHor.value); out.fog.near = lerp(60, 3, g); out.fog.far = lerp(340, 72, g);
      sunO.intensity = lerp(0.72, 0.26, g); sunO.color.copy(SUN_D).lerp(SUN_G, g); hemiO.intensity = lerp(0.55, 0.5, g);
      winL.intensity = lerp(0.62, 0.14, g); winL.color.copy(WIN_D).lerp(WIN_G, g); hemi.color.copy(HEMI_D).lerp(HEMI_G, g * 0.6); hemi.intensity = lerp(0.6, 0.5, g);
      mistM.opacity = 0.5 * smoothstep(0.15, 0.9, g); motes.pts.material.opacity = 0.75 * smoothstep(0.3, 1, g);
    }
    const OUT = { s: 37, v: 13 };
    let joint = -1, clack = true;
    function update(t, dt) {
      OUT.s += dt * OUT.v; scroll(OUT.s, t);
      // the carriage: a slow roll, and a bump at each rail joint (clack-clack); the camera rides along, a little less
      const J = 1.25, j = Math.floor(t / J), a = t - j * J, b = Math.exp(-Math.pow(a / 0.05, 2)) + Math.exp(-Math.pow((a - 0.16) / 0.05, 2));
      car.position.y = -b * 0.007 + Math.sin(t * 7.1) * 0.0012;
      car.rotation.x = Math.sin(t * 1.1) * 0.004 + Math.sin(t * 2.6 + 1) * 0.0015; car.rotation.z = Math.sin(t * 0.83 + 2) * 0.0012;
      if (j !== joint) { joint = j; clack = false; sfx('chug'); } else if (!clack && a > 0.16) { clack = true; sfx('chug'); }
      S.camera.position.y += car.position.y * 0.55; S.camera.rotateZ(car.rotation.x * 0.5);
      mood.g = damp(mood.g, mood.target, 2.4, dt); applyMood(mood.g);
    }
    function reset() { OUT.s = 37; mood.g = mood.target = 0; applyMood(0); joint = -1; }
    // set where the mood is heading (snap: be there now)
    function setMood(target, snap) { mood.target = target; if (snap) { mood.g = target; applyMood(target); } }
    return { scene, out, car, front, update, reset, mood: setMood };
  }

  // ------------------------------------------------------------ the beats: shots on a timeline; captions spread over it
  const CAPS = {
    open: ['Far to the north stands an old tower.', 'Something up there is swallowing every word.', 'And somewhere, a letter is losing its words.'],
    end: ['Far to the north, someone noticed.', 'A little color had come back to the world.', 'To be continued…'],
    journey: ['Today’s the day: I’m finally visiting Noa.', 'And I’m bringing her a surprise.',
      'The old pet shop said whatever hatches from it learns to talk just by listening. Like Noa, learning English from my letters.',
      'Her last letter was so strange. Half the words were just… gone.', 'Something’s been off with Noa lately.'],
  };
  let EXT = null, INT = null, STA = null, CMP = null, KIT = null;
  const SCN = { ext: () => EXT, int: () => INT, sta: () => STA, cmp: () => CMP };
  // hold: the pause for the game (onPause); show: the bars, caption and hints (0 hidden, 1 shown); grace: keys ignored after a pause
  const S = { running: false, renderer: null, camera: new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 1400), t: 0, clock: 0, T: 0, shots: [], caps: [], shot: -1, sceneNow: null, resolve: null, beat: null, ui: null,
    hold: null, show: 1, grace: 0, onPause: null, token: 0 };
  const BLACK = new THREE.Scene(); BLACK.background = new THREE.Color('#000000');
  const camAt = (p, q, fov) => { S.camera.position.set(p[0], p[1], p[2]); S.camera.lookAt(q[0], q[1], q[2]); if (S.camera.fov !== fov) { S.camera.fov = fov; S.camera.updateProjectionMatrix(); } };
  const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const dolly = (p0, p1, q0, q1, fov, k) => camAt(mix3(p0, p1, k), mix3(q0, q1, k), fov);
  // a figure-local point in world space
  const figPt = (x, y, z) => { const r = INT.fig.root; r.updateMatrixWorld(true); const v = new THREE.Vector3(x, y, z); r.localToWorld(v); return [v.x, v.y, v.z]; };
  const WIN_YAW = Math.atan2(0 - SEAT.x, WIN.z - SEAT.z), TURN = angDiff(SEAT_YAW, WIN_YAW);
  const STAND = new THREE.Vector3(0.34, 0, -3.28);
  const warmPulse = x => x <= 0 ? 0 : Math.min(1, x / 0.22) * (0.55 + 0.6 * Math.exp(-x * 1.9)) + 0.07 * Math.sin(x * 2.6) * Math.min(1, x);
  function sitting(P) { Object.assign(P, { sit: 1, lean: 0.28, yaw: 0, pitch: 0.55, clutch: 0, stepping: 0, eyes: 1, hideHead: false }); INT.fig.root.position.copy(SEAT); INT.fig.root.rotation.y = SEAT_YAW; }
  function blankBook() { INT.fig.book.words.forEach(w => { w.gone = true; }); INT.fig.book.draw(1); INT.fig.book.close(0); }
  // the journey: you, posed from HP each frame. Walking (speed, phase) or sitting (sit); arms 'carry' (the basket),
  // 'rest' (a hand on the basket) or 'read' (read 1: the letter up to read, 0: lowered to your lap); look/pitch turn the head
  const HP = {};
  function poseHero(dt, t) {
    const K = KIT, h = K.hero, P = HP;
    Object.assign(K.Y, { x: P.x, ry: P.y, z: P.z, yaw: P.yaw, speed: P.speed, phase: P.phase, look: P.look });
    h.holding = null; ACTORS.animateHero(h, K.Y, dt, t);
    h.head.rotation.x = P.pitch + Math.sin(P.phase * 2) * 0.03 * Math.min(1, P.speed / 5.4);
    const [a0, a1] = h.arms, r = P.read;
    if (P.sit) { h.body.position.y = 0; h.torso.rotation.x = P.lean || 0; h.legs.forEach((l, i) => { l.rotation.x = -1.42 + Math.sin(t * 3.6 + i * Math.PI) * 0.2 * P.kick; }); }
    if (P.arms === 'carry') a1.rotation.set(Math.sin(P.phase) * 0.1 * Math.min(1, P.speed / 3), 0, 0.52);
    else if (P.arms === 'rest') { a0.rotation.set(-0.42, 0, -0.6); a1.rotation.set(-0.62, 0, -0.16); }
    else if (P.arms === 'read') { a0.rotation.set(lerp(-0.66, -1.28, r), 0, lerp(0.2, 0.33, r)); a1.rotation.set(lerp(-0.66, -1.28, r), 0, -lerp(0.2, 0.33, r)); }
    const L = K.letter; L.visible = P.arms === 'read';
    if (L.visible) { L.position.set(0, lerp(0.56, 0.86, r), lerp(0.26, 0.33, r)); L.rotation.set(lerp(1.3, 0.35, r), Math.PI, 0); }
    const w = P.worry > 0.5, lid = (w ? 0.82 : 1) * (1 - (P.lids || 0));   // lids: eyes half shut, looking down (reading)
    K.brows.forEach(b => { b.visible = w; });
    K.mouth.rotation.z = w ? 0 : Math.PI; K.mouth.position.y = w ? 0.118 : 0.13; K.mouth.scale.set(1, w ? 1 : 1 - 0.7 * (P.glum || 0), 1);   // glum: the smile flattens
    if (lid !== 1) h.eyes.forEach(e => { e.scale.y *= lid; });
  }
  function kitTo(where) {
    const K = KIT, cmp = where === 'cmp';
    (cmp ? CMP.car : STA.scene).add(K.hero.root);
    K.packs.forEach(p => { p.visible = !cmp; });
    if (cmp) { CMP.car.add(K.basket); K.basket.position.copy(BASKET_AT); K.basket.rotation.set(0, 0.35, 0); } else K.hero.root.add(K.basket);
    K.wobble(-1);
  }
  // into the compartment: on the bench by the window, facing the way the train goes, the basket on the seat beside you
  function seat(o) {
    kitTo('cmp'); CMP.front.visible = true;
    Object.assign(HP, { x: HERO_AT.x, y: HERO_AT.y, z: HERO_AT.z, yaw: Math.PI / 2, speed: 0, phase: 0, sit: 1, arms: 'rest', read: 0, look: 0, pitch: 0, worry: 0, kick: 0, lids: 0, lean: 0, glum: 0 }, o);
    poseHero(10, S.clock);
  }

  const BEATS = {
    open: () => [
      { id: 'tower', scene: 'ext', dur: 5.0, capAt: 0.45, fadeIn: 0.9, fadeOut: 0.5,
        enter() { EXT.uni.uWarm.value = 0; sfx('bell'); },
        frame(lt) { dolly([-25, 8, 86], [-19, 9.5, 68], [-1.5, 15.5, 0], [-1, 16.5, 0], 36, ease(lt / 5)); } },
      { id: 'room', scene: 'int', dur: 2.7, capAt: 0.25, fadeIn: 0.55,
        enter() { sitting(INT.fig.P); INT.fig.book.reset(); INT.uni.warm = 0; Object.assign(INT.mist, { thick: 1, swirl: 0.3 }); },
        frame(lt) { const P = INT.fig.P; P.yaw = Math.sin(lt * 0.8) * 0.06; dolly([-0.95, 2.05, 2.5], [-0.75, 1.95, 2.0], [0.15, 1.45, -2.9], [0.2, 1.4, -2.85], 50, ease(lt / 2.7)); } },
      { id: 'book', scene: 'int', dur: 2.9,
        enter() { sitting(INT.fig.P); INT.fig.P.hideHead = true; sfx('page'); },   // through the figure's own eyes
        frame(lt) {
          const book = INT.fig.book, p = span(lt, 0.3, 2.6) * 1.02;
          book.draw(Math.min(1, p));
          book.words.forEach(w => { if (!w.gone && p > w.t0 + 0.05) { w.gone = true; const at = book.wordPos(w, new THREE.Vector3()); INT.puffMote(at); if (Math.random() < 0.6) INT.puffMote(at); } });
          const k = ease(lt / 2.9);
          camAt(figPt(lerp(0.0, 0.03, k), lerp(1.42, 1.36, k), lerp(0.64, 0.6, k)), figPt(0.03, 0.57, 0.31), 32);
        } },
      { id: 'turn', scene: 'int', dur: 3.9, capAt: 0, fadeOut: 0.7,
        enter() { sitting(INT.fig.P); blankBook(); },
        frame(lt) {
          const P = INT.fig.P, k = span(lt, 0.7, 2.3);
          P.yaw = TURN * k; P.pitch = lerp(0.55, -0.04, span(lt, 0.5, 2.0)); P.lean = lerp(0.28, 0.12, k);
          dolly([-1.45, 1.36, -3.35], [-1.25, 1.3, -3.2], [0.95, 0.98, -2.8], [0.95, 1.02, -2.8], 46, ease(lt / 3.9));
        } },
    ],
    end: () => [
      { id: 'pulse', scene: 'int', dur: 3.8, capAt: 0.25, fadeIn: 0.6,
        enter() { sitting(INT.fig.P); blankBook(); INT.uni.warm = 0; Object.assign(INT.mist, { thick: 1, swirl: 0.3 }); },
        frame(lt) {
          const P = INT.fig.P;
          if (lt > 1.0 && !this.rang) { this.rang = true; sfx('bell'); }
          INT.uni.warm = warmPulse(lt - 1.0);
          P.pitch = lerp(0.55, -0.22, span(lt, 1.35, 2.5)); P.yaw = TURN * 0.55 * span(lt, 1.4, 2.8); P.lean = lerp(0.28, 0.05, span(lt, 1.35, 2.5));
          dolly([-1.15, 1.75, 2.6], [-1.0, 1.7, 2.2], [0.2, 1.45, -3.0], [0.25, 1.5, -3.0], 48, ease(lt / 3.8));
        } },
      // from just outside the window, looking in: it stands, steps toward us, holds the notebook close; the bell's mist churns behind it
      { id: 'rise', scene: 'int', dur: 4.0, capAt: 0, fadeOut: 0.55,
        enter() { sitting(INT.fig.P); blankBook(); INT.uni.outside = false; },
        exit() { INT.uni.outside = true; },
        frame(lt) {
          const P = INT.fig.P, f = INT.fig, st = span(lt, 0.15, 1.0), mv = span(lt, 0.8, 2.3);
          INT.uni.warm = 0.62 + 0.1 * Math.sin(lt * 2.4) + 0.35 * Math.exp(-Math.pow((lt - 1.9) * 2.4, 2));
          P.sit = 1 - st; P.lean = lerp(0.05, -0.04, st);
          f.root.position.copy(SEAT).lerp(STAND, mv * 0.92 + st * 0.08); f.root.rotation.y = SEAT_YAW + TURN * span(lt, 0.5, 2.0);
          P.yaw = TURN * 0.55 * (1 - span(lt, 0.5, 2.0)); P.pitch = lerp(-0.22, -0.02, mv);
          P.stepping = Math.sin(mv * Math.PI); P.walk = mv * 12;
          P.clutch = span(lt, 1.5, 2.6);
          INT.mist.thick = lerp(1, 2.8, span(lt, 0.4, 3.4)); INT.mist.swirl = lerp(0.3, 1.4, span(lt, 0.4, 3.4));
          dolly([0.12, 2.42, -6.75], [0.12, 2.34, -6.45], [0.55, 1.0, -3.0], [0.38, 1.08, -3.25], 32, ease(lt / 4.0));
        } },
      { id: 'far', scene: 'ext', dur: 4.6, capAt: 0.35, fadeIn: 0.7, fadeOut: 0.9,
        enter() { EXT.uni.uWarm.value = 0; },
        frame(lt) { EXT.uni.uWarm.value = span(lt, 0.4, 1.8); dolly([-15, 31, -46], [-13, 30.5, -41], [4, 15, 120], [2, 15, 120], 40, ease(lt / 4.6)); } },
    ],
    journey: () => [
      // your home station on a spring morning: out of the station house, along the platform, up into the carriage
      { id: 'station', scene: 'sta', dur: 4.2, capAt: 0.5, fadeIn: 0.9, fadeOut: 0.35,
        enter() { kitTo('sta'); STA.reset(); },
        frame(lt, dt) {
          STA.walk(lt, HP); poseHero(dt, S.clock); KIT.hang();
          if (lt > 3.0 && !this.blew) { this.blew = true; sfx('whistle'); STA.steam.rate = 0.2; }
          // the camera follows you along the platform, keeping room ahead of you
          const k = ease(lt / 4.2), fx = lerp(5.0, 0.6, ease(Math.min(1, lt / 3.2)));
          camAt([fx - 6.6, lerp(3.4, 3.1, k), lerp(11.6, 10.6, k)], [fx, lerp(1.9, 2.05, k), 2.2], 32);
        } },
      // the compartment, seen like a stage (its corridor wall taken away): you by the window, the basket beside you,
      // the land going by; on "a surprise" you turn to the basket
      { id: 'compartment', scene: 'cmp', dur: 4.8, capAt: 0.35, fadeIn: 0.5,
        enter() { seat({ look: 0.55, kick: 1 }); CMP.front.visible = false; CMP.mood(0, true); },
        frame(lt, dt) {
          const glance = span(lt, 2.2, 2.9);
          Object.assign(HP, { look: lerp(0.55 + Math.sin(lt * 1.3) * 0.1, -0.75, glance), pitch: lerp(-0.06, 0.3, glance), kick: 1 }); poseHero(dt, S.clock);
          dolly([0.45, 1.5, 3.0], [0.3, 1.42, 2.6], [-0.3, 1.12, -1.0], [-0.35, 1.08, -0.9], 40, ease(lt / 4.8));
        } },
      // the egg in its basket, close: it wobbles, once; you give a little start, and the camera tilts up to your smile
      { id: 'egg', scene: 'cmp', dur: 5.6, capAt: 0.2,
        enter() { seat({ look: -0.75, pitch: 0.3, kick: 0.5 }); CMP.front.visible = false; CMP.mood(0, true); },
        frame(lt, dt) {
          KIT.wobble((lt - 2.1) / 1.1);
          const lean = span(lt, 2.4, 2.9), hop = Math.sin(span(lt, 2.35, 2.75) * Math.PI) * 0.035, up = span(lt, 3.1, 4.7);
          Object.assign(HP, { y: HERO_AT.y + hop, look: -0.75 + Math.sin(lt * 0.9) * 0.05, pitch: 0.3 + 0.1 * lean - hop * 2, kick: 0.5 * (1 - lean) }); poseHero(dt, S.clock);
          const near = mix3([-0.08, 1.16, 1.2], [-0.2, 1.12, 1.1], ease(Math.min(1, lt / 3.1)));   // a slow push in on the egg
          camAt(mix3(near, [0.3, 1.4, 1.35], up), mix3([-1.1, 0.86, 0.18], [-1.05, 1.05, -0.2], up), lerp(38, 46, up));
        } },
      // Noa's letters: the game shows them over this shot (onPause('letters')); without onPause it holds 2 s.
      // You're in the left third, the window in the right one (the letter's paper covers the middle).
      // lt keeps running for as long as the letters are up: a slow, calm push that never quite arrives
      { id: 'reading', scene: 'cmp', dur: 2.0, pause: 'letters',
        enter() { seat({ arms: 'read', read: 1, pitch: 0.4, lids: 0.45, kick: 0.3 }); CMP.mood(0, true); },
        frame(lt, dt) {
          const k = 1 - Math.exp(-lt / 12), line = (lt * 0.11) % 1;
          Object.assign(HP, { look: Math.sin(lt * 0.5) * 0.05 + 0.02, pitch: 0.38 + line * 0.1 }); poseHero(dt, S.clock);
          camAt([lerp(1.3, 1.15, k), lerp(1.4, 1.37, k), lerp(0.2, 0.05, k) + Math.sin(lt * 0.21) * 0.04], [0.1, 1.2, -1.0], 46);
        } },
      // the mood turns: you lower the letter and look out, worried (seen from the seat across); the land goes gray
      { id: 'window', scene: 'cmp', dur: 5.0, capAt: 0.8,
        enter() { seat({ arms: 'read', read: 1, pitch: 0.38, lids: 0.45 }); CMP.mood(0.04, true); },
        frame(lt, dt) {
          const lower = span(lt, 0.25, 1.25), turn = span(lt, 0.9, 2.1);
          Object.assign(HP, { read: 1 - lower, look: 0.85 * turn, pitch: lerp(0.38, 0.07, turn), lean: 0.07 * turn, lids: 0.45 * (1 - lower), glum: lower, worry: lt > 1.5 ? 1 : 0 }); poseHero(dt, S.clock);
          CMP.mood(lerp(0.04, 0.62, span(lt, 0.9, 5.0)));
          dolly([1.35, 1.42, -0.3], [1.2, 1.4, -0.38], [-0.85, 1.28, -0.74], [-0.85, 1.3, -0.76], 40, ease(lt / 5.0));
        } },
      // over your shoulder, out of the window: the land going gray and the haze closing in
      { id: 'north', scene: 'cmp', dur: 4.4, capAt: 0.3, fadeOut: 1.1,
        enter() { seat({ arms: 'read', read: 0, look: 1.05, pitch: 0.04, lean: 0.07, worry: 1 }); },
        frame(lt, dt) {
          Object.assign(HP, { look: 1.05 + Math.sin(lt * 0.7) * 0.03 }); poseHero(dt, S.clock);
          CMP.mood(lerp(0.62, 1, span(lt, 0, 3.4)));
          dolly([-0.5, 1.6, 0.45], [-0.46, 1.55, 0.05], [-0.12, 1.28, -3.2], [-0.1, 1.26, -3.2], 46, ease(lt / 4.4));
        } },
    ],
  };

  // ------------------------------------------------------------ captions: a letterboxed DOM layer over the canvas
  const CSS = `
#interlude-ui { position: fixed; inset: 0; z-index: 46; pointer-events: none; overflow: hidden; font-family: Bahnschrift, "Segoe UI", system-ui, sans-serif; color: #f4ecdc; }
#interlude-ui .il-bar { position: absolute; left: 0; right: 0; background: #07060b; }
#interlude-ui .il-top { top: 0; height: 10vh; }
#interlude-ui .il-bot { bottom: 0; height: 16vh; }
#interlude-ui .il-cap { position: absolute; left: 50%; bottom: 0; height: 16vh; width: min(980px, calc(100vw - 200px)); transform: translateX(-50%); display: flex; align-items: center; justify-content: center;
  text-align: center; font-size: clamp(18px, 2.3vw, 27px); font-weight: 600; letter-spacing: .02em; line-height: 1.3; text-shadow: 0 2px 0 rgba(0,0,0,.65); }
#interlude-ui .il-cap .gh { visibility: hidden; }
#interlude-ui .il-next { position: absolute; right: 26px; bottom: calc(8vh - 12px); font: 800 14px "Segoe UI", system-ui, sans-serif; color: rgba(244,236,220,.85); opacity: 0; transition: opacity .25s; animation: il-bob 1s ease-in-out infinite; }
#interlude-ui .il-next kbd { display: inline-block; font: 800 13px "Segoe UI", system-ui, sans-serif; background: #f4ecdc; color: #2b2235; border-radius: 6px; padding: 0 6px; margin-right: 5px; }
#interlude-ui .il-skip { position: absolute; right: 22px; top: calc(5vh - 9px); font: 700 12px "Segoe UI", system-ui, sans-serif; letter-spacing: .12em; text-transform: uppercase; color: rgba(244,236,220,.5); }
#interlude-ui .il-skip kbd { font: inherit; border: 1.5px solid rgba(244,236,220,.5); border-radius: 5px; padding: 0 4px; margin-right: 5px; }
#interlude-ui .il-tag { position: absolute; left: 24px; top: calc(5vh - 10px); font: 700 13px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .16em; text-transform: uppercase; color: rgba(244,236,220,.62); }
#interlude-ui .il-fade { position: absolute; inset: 0; background: #000; }
@keyframes il-bob { 50% { transform: translateY(-3px); } }`;
  function mountUI(tag) {
    unmountUI();
    const root = document.createElement('div'); root.id = 'interlude-ui';
    root.innerHTML = `<style>${CSS}</style><div class="il-bar il-top"></div><div class="il-bar il-bot"></div><div class="il-cap"></div>` +
      `<div class="il-next"><kbd>E</kbd>▸</div><div class="il-skip"><kbd>Esc</kbd>skip</div>${tag ? `<div class="il-tag">${esc(tag)}</div>` : ''}<div class="il-fade"></div>`;
    document.body.appendChild(root);
    const q = s => root.querySelector(s);
    S.ui = { root, top: q('.il-top'), bot: q('.il-bot'), cap: q('.il-cap'), next: q('.il-next'), fade: q('.il-fade'), skip: q('.il-skip'), tag: q('.il-tag'), shown: '', chrome: '' };
  }
  function unmountUI() { const r = document.getElementById('interlude-ui'); if (r) r.remove(); S.ui = null; }
  // S.show (0..1) hides the bars, caption and hints while the game has the screen (a pause), and slides them back after
  function drawUI(sh, lt) {
    const U = S.ui; if (!U) return;
    const t = S.t, show = S.show, bars = ease(t / 0.7) * show;
    const ch = show.toFixed(2); if (U.chrome !== ch) { U.chrome = ch; U.skip.style.opacity = ch; if (U.tag) U.tag.style.opacity = ch; }
    U.top.style.transform = `translateY(${(-100 * (1 - bars)).toFixed(1)}%)`; U.bot.style.transform = `translateY(${(100 * (1 - bars)).toFixed(1)}%)`;
    let f = 0;
    if (sh.fadeIn && lt < sh.fadeIn) f = Math.max(f, 1 - lt / sh.fadeIn);
    if (sh.fadeOut && lt > sh.dur - sh.fadeOut) f = Math.max(f, (lt - (sh.dur - sh.fadeOut)) / sh.fadeOut);
    U.fade.style.opacity = clamp(f, 0, 1).toFixed(3);
    const c = S.caps.find(k => t >= k.start && t < k.end);
    let html = '', op = 0, done = false;
    if (c) {
      const n = Math.min(c.text.length, Math.floor((t - c.start) * 42) + 1);
      done = n >= c.text.length;
      html = esc(c.text.slice(0, n)) + `<span class="gh">${esc(c.text.slice(n))}</span>`;
      op = Math.min(1, (t - c.start) / 0.2) * Math.min(1, (c.end - t) / 0.3);
    }
    if (html !== U.shown) { U.cap.innerHTML = html; U.shown = html; }
    U.cap.style.opacity = (op * show).toFixed(3);
    U.next.style.opacity = done && op > 0.9 && show > 0.99 ? '1' : '0';
  }

  // ------------------------------------------------------------ the contract
  function play(o = {}) {
    if (S.running) end(true);
    if (!o.renderer) throw new Error('INTERLUDE.play needs opts.renderer');
    S.renderer = o.renderer;
    const beat = BEATS[o.beat] ? o.beat : 'open';
    const shots = BEATS[beat]();
    // build (once) only the scenes this beat uses
    const uses = new Set(shots.map(s => s.scene));
    if (uses.has('ext') && !EXT) EXT = buildExterior();
    if (uses.has('int') && !INT) INT = buildInterior();
    if ((uses.has('sta') || uses.has('cmp')) && !KIT) KIT = buildKit();
    if (uses.has('sta') && !STA) STA = buildStation();
    if (uses.has('cmp') && !CMP) CMP = buildCompartment();
    let T = 0; shots.forEach(s => { s.start = T; T += s.dur; });
    const caps = (Array.isArray(o.captions) && o.captions.length ? o.captions : CAPS[beat]).map(String);
    const slots = shots.filter(s => s.capAt !== undefined).map(s => s.start + s.capAt);
    const P = shots.find(s => s.pause);   // a pause shot (the journey's letters) never has a caption over it
    let starts;
    if (caps.length === slots.length) starts = slots;
    else if (!P) {
      const need = caps.length * 3.6 + 1.0;
      if (need > T) { shots[shots.length - 1].dur += need - T; T = need; }
      starts = caps.map((_, i) => 0.35 + i * (T - 1.0) / caps.length);
    } else {   // spread them over the shots on either side of the pause
      const need = caps.length * 3.6 + 1.0;
      if (need > T - P.dur) { shots[shots.length - 1].dur += need - (T - P.dur); T = need + P.dur; }
      const after = P.start + P.dur;
      starts = caps.map((_, i) => { const p = 0.35 + i * (T - P.dur - 1.0) / caps.length; return p < P.start - 1.2 ? p : Math.max(p + P.dur, after + 0.3); });
    }
    S.caps = caps.map((text, i) => {
      let end = i + 1 < caps.length ? starts[i + 1] : T - 0.35;
      if (P && starts[i] < P.start) end = Math.min(end, P.start - 0.15);
      return { text, start: starts[i], end };
    });
    Object.assign(S, { beat, shots, T, t: 0, clock: 0, shot: -1, sceneNow: null, running: true, hold: null, show: 1, grace: 0, onPause: typeof o.onPause === 'function' ? o.onPause : null, token: S.token + 1 });
    if (uses.has('int')) {
      // the room is already misty when we first see it
      INT.clearFx(); INT.fig.book.reset(); sitting(INT.fig.P); INT.uni.warm = 0; INT.uni.outside = true; Object.assign(INT.mist, { thick: 1, swirl: 0.3 });
      for (let i = 0; i < 70; i++) INT.update(-5 + i / 14, 1 / 14);
    }
    if (EXT) EXT.uni.uWarm.value = 0;
    if (uses.has('cmp')) CMP.reset();
    mountUI(o.tag);
    return new Promise(res => { S.resolve = res; update(0, null); });
  }
  // the pause: hand the screen to the game (its letters) and wait; the shot keeps moving meanwhile
  function hold(sh) {
    const h = S.hold = { name: sh.pause, t: 0, done: false }, token = S.token;
    S.t = sh.start; S.show = 0;
    let p; try { p = S.onPause(sh.pause); } catch (e) { console.error('[interlude] onPause', e); }
    Promise.resolve(p).catch(e => console.error('[interlude] onPause', e)).then(() => { if (S.token === token && S.hold === h) h.done = true; });
  }
  function tick(sh, lt, dt) {
    sh.frame(lt, dt);
    SCN[sh.scene]().update(S.clock, dt);
    drawUI(sh, lt);
  }
  function jump() {
    const marks = S.shots.map(s => s.start).concat(S.caps.map(c => c.start)).filter(x => x > S.t + 0.4).sort((a, b) => a - b);
    if (marks.length) S.t = marks[0];
    else if (S.t < S.T - 0.7) S.t = S.T - 0.7;
  }
  function update(dt, input) {
    if (!S.running) return;
    dt = Math.min(0.05, Math.max(0, dt || 0));
    let inp = input || {};
    // paused for the game: the shot keeps moving (lt = time in the pause), the timeline and the keys wait
    if (S.hold) {
      if (!S.hold.done) { S.clock += dt; S.hold.t += dt; S.show = 0; tick(S.shots[S.shot], S.hold.t, dt); return; }
      const sh = S.shots[S.shot]; S.hold = null; S.t = sh.start + sh.dur; S.grace = 0.35;   // on with the next shot; the key that closed the game's screen doesn't count here
    }
    if (S.grace > 0) { S.grace -= dt; inp = {}; }
    if (inp.cancel) {
      const P = S.shots.find(s => s.pause);
      if (P && S.t < P.start) S.t = P.start;   // the letters always show: Esc before them goes straight there
      else { end(true); return; }
    } else if (inp.interact) jump();
    S.t += dt; S.clock += dt; S.show = Math.min(1, S.show + dt / 0.5);
    if (S.t >= S.T) { end(false); return; }
    let i = S.shots.findIndex(s => S.t < s.start + s.dur); if (i < 0) i = S.shots.length - 1;
    const sh = S.shots[i];
    if (i !== S.shot) {
      const prev = S.shots[S.shot]; if (prev && prev.exit) prev.exit();
      S.shot = i; S.sceneNow = SCN[sh.scene]().scene; if (sh.enter) sh.enter();
      if (sh.pause && S.onPause) { hold(sh); tick(sh, 0, dt); return; }
    }
    tick(sh, S.t - sh.start, dt);
  }
  function render() {
    const r = S.renderer; if (!r) return;
    r.getSize(v2); const asp = v2.x / Math.max(1, v2.y);
    if (Math.abs(S.camera.aspect - asp) > 1e-4) { S.camera.aspect = asp; S.camera.updateProjectionMatrix(); }
    const sc = S.running && S.sceneNow ? S.sceneNow : BLACK, under = sc.userData.under;
    if (!under) { r.render(sc, S.camera); return; }
    // two passes (the compartment): the outside first, then the room over it
    r.render(under, S.camera);
    const ac = r.autoClear; r.autoClear = false; r.clearDepth(); r.render(sc, S.camera); r.autoClear = ac;
  }
  function end(skipped) {
    if (!S.running) return;
    S.running = false; S.sceneNow = null; S.hold = null; S.onPause = null; S.grace = 0; S.token++; unmountUI();
    const r = S.resolve; S.resolve = null;
    if (r) r({ beat: S.beat, skipped: !!skipped });
  }
  // the scenes are built once and kept; dispose() frees them if the game won't show another interlude
  function dispose() {
    if (S.running) end(true);
    const keep = new Set(Object.values(G)), keepTex = new Set([glowTex, puffTex, TK.sparkTex]);
    [EXT, INT, STA, CMP].forEach(X => X && [X.scene, X.scene.userData.under].forEach(sc => sc && sc.traverse(o => {
      if (o.geometry && !keep.has(o.geometry)) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(m => { if (m.map && !keepTex.has(m.map)) m.map.dispose(); });
    })));
    EXT = INT = STA = CMP = KIT = null;
    Object.keys(GEO).forEach(k => delete GEO[k]);
  }
  function snapshotSVG(w, h) {
    const root = document.getElementById('interlude-ui'); if (!root) return null;
    const clone = root.cloneNode(true); clone.style.position = 'absolute'; clone.style.inset = '0';
    const xhtml = new XMLSerializer().serializeToString(clone);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${w}px;height:${h}px">${xhtml}</div></foreignObject></svg>`;
  }
  function triangles(obj) {
    let n = 0;
    obj.traverse(o => { if (!o.isMesh || !o.visible) return; const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (g.isInstancedBufferGeometry ? g.instanceCount : 1) * (o.isInstancedMesh ? o.count : 1); });
    return Math.round(n);
  }
  return {
    play, update, render, buildTower, dispose,
    beats: Object.keys(BEATS),
    isRunning: () => S.running,
    skip: () => end(true),
    _: { S, CAPS, get EXT() { return EXT || (EXT = buildExterior()); }, get INT() { return INT || (INT = buildInterior()); },
      get KIT() { return KIT || (KIT = buildKit()); }, get STA() { return STA || (KIT || (KIT = buildKit()), STA = buildStation()); }, get CMP() { return CMP || (KIT || (KIT = buildKit()), CMP = buildCompartment()); },
      camAt, snapshotSVG, triangles, figPt },
  };
})();
