'use strict';
// The creatures of the Hush, in toon 3D. Three kinds, each wearing its color on its body (the
// color is a word you aim with: red, blue, green, yellow):
//   hushling: a soft felt dumpling in its color, with the Hush's gray-violet nightcap, a sleepy
//             face and a curly tail. The big one ('hushbig') carries a quilted shell on its back;
//             its head, tail and shell are targetable parts, and the weak one glows.
//   moth:     a fuzzy gray moth with a fluffy collar and big colored wings (flat paper cutouts with
//             eye spots). It floats, so ground hits can't reach it; hit its wings to knock it down.
//   beetle:   a sturdy gray beetle under a colored, two-part shell. Hits on the shell barely hurt;
//             its head (the weak spot) and its little tail don't have that armor.
//   armadillo: a gray armadillo with colored bands across its shell, big ears and a cute face. It
//             curls up into an armored ball (F.curl), rolls (F.spin), and a push lays it on its
//             back (F.flip), belly up and legs waving.
//   frog:     a round gray frog sitting on its haunches, its back in its color with pale spots, big
//             eyes on bumps on top of its head, a wide smile, a pale throat that puffs (F.croak, F.puff),
//             back legs that kick out when it leaps, and a long tongue it lashes (F.lash, F.lashYaw, F.lashPitch).
// Built facing +z with the feet (or, for the moth, the bottom of its body) at the origin.
// Also here: little food props for eating in battle (food(id)).
(() => {
  const B = window.BATTLE, _ = B._;
  const { part, G, glowTex } = TK;
  const INK = '#2b2235';
  const BASE = '#8e87a7', BASE_D = '#6c6588', SHELL = '#5b5276', POM = '#f6f0e6', WARM = '#f3c9a8';
  // (white came with the Corn Society: its kernels are corn colors, yellow, white, red and blue)
  const COLORS = { red: '#e2574c', blue: '#4c7fd8', green: '#5fb257', yellow: '#f2c94c', white: '#f4efe2' };
  const shade = (hex, k) => { const c = new THREE.Color(hex); return k < 0 ? c.multiplyScalar(1 + k) : c.lerp(new THREE.Color('#ffffff'), k); };
  // the creature's color, a touch dusty (the Hush is on it); it brightens to the full color when the Hush lifts
  const hushed = hex => new THREE.Color(hex).lerp(new THREE.Color(BASE), 0.18);
  const KINDS = { hushling: 1, hushbig: 1, moth: 1, beetle: 1, armadillo: 1, frog: 1, dummy: 1, kernel: 1, popcorn: 1, colonel: 1, bat: 1, bee: 1, snowball: 1, crab: 1 };
  // 'hushling_big', 'boss' → 'hushbig'; 'moth', 'beetle', 'armadillo', 'frog', 'dummy', 'kernel', 'popcorn', 'colonel';
  // anything else is a hushling
  const kindOf = k => {
    const s = String(k || '');
    if (/colonel/.test(s)) return 'colonel';
    if (/big|boss/.test(s)) return 'hushbig';
    for (const x of ['moth', 'beetle', 'armadillo', 'frog', 'dummy', 'kernel', 'popcorn', 'bat', 'bee', 'snowball', 'crab']) if (s.includes(x)) return x;     // ('bee' after 'beetle')
    return 'hushling';
  };

  // ------------------------------------------------------------ felt
  const feltTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const c = cv.getContext('2d'), R = rng(7);
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 2600; i++) { const v = 214 + Math.floor(R() * 41); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(R() * 128, R() * 128, 1 + R() * 1.6, 1 + R() * 1.6); }
    c.globalAlpha = 0.45; c.strokeStyle = '#dcd6e4'; c.lineWidth = 0.9;
    for (let i = 0; i < 260; i++) {
      const x = R() * 128, y = R() * 128, a = R() * TAU, l = 2 + R() * 6;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2);
    return t;
  })();
  // A toon material with the felt texture and TK's rim light. One per foe part, so a foe can
  // flash, tint (the Hush lifting) or glow (weak point) on its own. o.lift: the color it warms
  // up to when the Hush lifts (brighten); gray felt warms toward peach, colored felt gets its full color.
  function feltMat(color, o = {}) {
    const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: TK.grad, map: o.noTex ? null : feltTex, emissive: new THREE.Color(o.emissive || '#000000') });
    const rim = o.rim === undefined ? 0.26 : o.rim;
    m.onBeforeCompile = sh => {
      sh.uniforms.rimAmt = { value: rim };
      sh.fragmentShader = 'uniform float rimAmt;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>',
        'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\n' +
        'gl_FragColor.rgb += vec3(1.0, 0.95, 0.86) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
    };
    m.customProgramCacheKey = () => 'feltrim' + (o.noTex ? '0' : '1');
    m.userData.base = m.color.clone();
    m.userData.lift = o.lift ? new THREE.Color(o.lift) : m.color.clone().lerp(new THREE.Color(WARM), o.warm === undefined ? 0.5 : o.warm);
    return m;
  }
  const basic = color => new THREE.MeshBasicMaterial({ color });
  const lathe = (pts, n = 24) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  // geometry for a segment that pivots at its base
  const seg = (rt, rb, len, n = 10) => { const g = new THREE.CylinderGeometry(rt, rb, len, n); g.translate(0, len / 2, 0); return g; };
  const halfEye = new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2);
  const arc = new THREE.TorusGeometry(1, 0.2, 6, 14, Math.PI);
  const zTex = TK.canvasTex(64, 64, c => { c.font = '900 52px Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeStyle = '#ffffff'; c.strokeText('z', 32, 34); c.fillStyle = INK; c.fillText('z', 32, 34); });
  const reticleTex = TK.canvasTex(128, 128, c => {
    c.translate(64, 64); c.lineCap = 'round';
    const ring = (lw, col) => { c.lineWidth = lw; c.strokeStyle = col; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(0, 0, 44, i * Math.PI / 2 + 0.25, (i + 1) * Math.PI / 2 - 0.25); c.stroke(); } };
    ring(14, INK); ring(7, '#ffc84a');
    for (let i = 0; i < 4; i++) { c.save(); c.rotate(i * Math.PI / 2); c.beginPath(); c.moveTo(0, -60); c.lineTo(0, -36); c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#ffc84a'; c.stroke(); c.restore(); }
  });
  const noteTex = TK.canvasTex(64, 64, c => { c.font = '900 50px Segoe UI Symbol, Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 7; c.strokeStyle = INK; c.strokeText('♪', 30, 34); c.fillStyle = '#fff3a0'; c.fillText('♪', 30, 34); });

  // ------------------------------------------------------------ flat cutouts (the moth's wings)
  // A shape grown (w > 0) or shrunk (w < 0) by w along its outline.
  function offsetShape(shape, w, n = 48) {
    const pts = shape.getSpacedPoints(n);
    if (pts.length > 2 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a.x * b.y - b.x * a.y; }
    const sg = area > 0 ? 1 : -1;
    return new THREE.Shape(pts.map((p, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
      const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      return new THREE.Vector2(p.x + (ty / l) * w * sg, p.y - (tx / l) * w * sg);
    }));
  }
  // a thin slab of a shape, centered on z = 0, so it reads from both sides
  function slab(shape, depth) { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 18 }); g.translate(0, 0, -depth / 2); return g; }
  const circle = (x, y, r) => { const s = new THREE.Shape(); s.absarc(x, y, r, 0, TAU, false); return s; };
  // One wing: an ink rim (a bigger, thinner slab inside the wing's thickness, so it only shows at
  // the edge, from either side), a darker border, the color, and an eye spot. Its hinge is at (0, 0).
  function wingCutout(shape, M, spot) {
    const g = new THREE.Group();
    const mesh = (geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.castShadow = !o.noShadow; if (o.ink) m.userData.noFlash = true; g.add(m); return m; };
    mesh(slab(offsetShape(shape, 0.022), 0.014), M.ink, { ink: true, noShadow: true });
    mesh(slab(shape, 0.026), M.edge);
    mesh(slab(offsetShape(shape, -0.045), 0.032), M.wing, { noShadow: true });
    if (spot) {
      mesh(slab(circle(spot[0], spot[1], spot[2] + 0.018), 0.036), M.ink, { ink: true, noShadow: true });
      mesh(slab(circle(spot[0], spot[1], spot[2]), 0.04), M.spot, { noShadow: true });
      mesh(slab(circle(spot[0] + spot[2] * 0.12, spot[1] - spot[2] * 0.08, spot[2] * 0.45), 0.044), M.ink, { ink: true, noShadow: true });
    }
    return g;
  }
  // upper wing: from the hinge out and up to a rounded tip; lower wing: a smaller lobe below it
  const UPPER = (() => { const s = new THREE.Shape(); s.moveTo(0, 0.06); s.bezierCurveTo(0.14, 0.27, 0.4, 0.4, 0.57, 0.35); s.bezierCurveTo(0.7, 0.31, 0.68, 0.1, 0.53, 0.02); s.bezierCurveTo(0.37, -0.06, 0.14, -0.06, 0, -0.03); return s; })();
  const LOWER = (() => { const s = new THREE.Shape(); s.moveTo(0, 0.02); s.bezierCurveTo(0.18, 0.04, 0.41, -0.02, 0.44, -0.16); s.bezierCurveTo(0.46, -0.31, 0.26, -0.35, 0.14, -0.28); s.bezierCurveTo(0.06, -0.22, 0.01, -0.11, 0, -0.03); return s; })();

  // ------------------------------------------------------------ the face: eyes that can be sleepy, open, shut, happy or hurt
  function eye(parent, x, y, z, s, side) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = side * 0.32; parent.add(g);
    const dark = basic(INK);
    const mesh = (geo, mat, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); return m; };
    const open = new THREE.Group(); g.add(open);
    open.add(mesh(G.sphere, dark, 0.062 * s, 0.082 * s, 0.03 * s));
    const spark = new THREE.Mesh(G.sphere, basic('#fff6c8')); spark.scale.setScalar(0.022 * s); spark.position.set(0.016 * s, 0.026 * s, 0.022 * s); open.add(spark);
    const half = new THREE.Group(); g.add(half);
    half.add(mesh(halfEye, dark, 0.066 * s, 0.07 * s, 0.03 * s));
    const lid = new THREE.Mesh(G.box, dark); lid.scale.set(0.15 * s, 0.016 * s, 0.03 * s); lid.position.set(0, 0.006 * s, 0.004 * s); lid.rotation.z = -side * 0.12; half.add(lid);
    const hs = new THREE.Mesh(G.sphere, basic('#fff6c8')); hs.scale.setScalar(0.016 * s); hs.position.set(0.018 * s, -0.022 * s, 0.024 * s); half.add(hs);
    const shut = new THREE.Mesh(arc, dark); shut.scale.set(0.05 * s, 0.05 * s, 0.05 * s); shut.rotation.z = Math.PI; g.add(shut);
    const happy = new THREE.Mesh(arc, dark); happy.scale.set(0.05 * s, 0.05 * s, 0.05 * s); happy.position.y = -0.02 * s; g.add(happy);
    const hurt = new THREE.Group(); g.add(hurt);
    [-1, 1].forEach(k => { const b = new THREE.Mesh(G.box, dark); b.scale.set(0.085 * s, 0.018 * s, 0.02 * s); b.position.y = k * 0.018 * s; b.rotation.z = side * k * 0.45; hurt.add(b); });
    return { g, open, half, shut, happy, hurt };
  }
  function setEye(e, mode) {
    e.open.visible = mode === 'open'; e.half.visible = mode === 'half'; e.shut.visible = mode === 'shut';
    e.happy.visible = mode === 'happy'; e.hurt.visible = mode === 'hurt';
  }
  // eyes, mouth (with a tongue), cheeks and angry brows, on a face group; k scales it
  function buildFace(face, k, eyeX, eyeS) {
    const eyes = [-1, 1].map(s => eye(face, s * eyeX, 0.02 * k, 0.012 * k, eyeS, s));
    const mouth = new THREE.Mesh(G.sphere, basic(INK)); mouth.scale.set(0.034 * k, 0.02 * k, 0.012 * k); mouth.position.set(0, -0.1 * k, 0.03 * k); face.add(mouth);
    const tongue = new THREE.Mesh(G.sphere, basic('#d9647a')); tongue.scale.set(0.024 * k, 0.012 * k, 0.01 * k); tongue.position.set(0, -0.118 * k, 0.036 * k); tongue.visible = false; face.add(tongue);
    [-1, 1].forEach(s => { const b = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#e58fb0', transparent: true, opacity: 0.5 })); b.scale.set(0.065 * k, 0.035 * k, 0.02 * k); b.position.set(s * eyeX * 1.73, -0.075 * k, -0.035 * k); b.rotation.y = s * 0.55; face.add(b); });
    const brows = [-1, 1].map(s => { const b = new THREE.Mesh(G.box, basic(INK)); b.scale.set(0.1 * k, 0.022 * k, 0.02 * k); b.position.set(s * eyeX, 0.125 * k, 0.015 * k); b.rotation.z = s * 0.35; b.visible = false; face.add(b); return b; });
    return { eyes, mouth, tongue, brows, mouthK: k };
  }
  // weak points: a warm halo plus a gold "aim here" reticle drawn on top of everything
  // (no tinting, so a red body never looks orange in a game about color words)
  function glowMaker(glows, reticles) {
    return (key, parent, pos, s) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc46b', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.position.set(...pos); sp.scale.setScalar(s); sp.userData.s = s; parent.add(sp); glows[key] = sp;
      const rt = new THREE.Sprite(new THREE.SpriteMaterial({ map: reticleTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
      rt.position.set(...pos); rt.renderOrder = 8; rt.userData.s = s * 0.62; parent.add(rt); reticles[key] = rt;
    };
  }
  function anchorSet(spots) {
    const a = {};
    for (const [key, parent, pos] of spots) { const o = new THREE.Object3D(); o.position.set(...pos); parent.add(o); a[key] = o; }
    return a;
  }

  // ------------------------------------------------------------ a Hushling
  // o: { color, size: 'small'|'big', kind: 'hushling'|'hushbig'|'moth'|'beetle' }
  function build(o = {}) {
    const kind = KINDS[o.kind] ? o.kind : kindOf(o.kind);
    if (kind === 'moth') return buildMoth(o);
    if (kind === 'beetle') return buildBeetle(o);
    if (kind === 'armadillo') return buildArmadillo(o);
    if (kind === 'frog') return buildFrog(o);
    if (kind === 'dummy') return buildDummy(o);
    if (kind === 'kernel') return buildKernel(o);
    if (kind === 'popcorn') return buildPopcorn(o);
    if (kind === 'colonel') return buildColonel(o);
    if (kind === 'bat') return buildBat(o);
    if (kind === 'bee') return buildBee(o);
    if (kind === 'snowball') return buildSnowball(o);
    if (kind === 'crab') return buildCrab(o);
    const bigOne = kind === 'hushbig';
    const col = COLORS[o.color] || COLORS.red, body0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    // the body is the creature's color; the nightcap is the Hush's gray-violet felt
    const M = {
      base: feltMat(body0, { lift: col }), dark: feltMat(shade(body0, -0.2), { lift: shade(col, -0.15) }), belly: feltMat(new THREE.Color(body0).lerp(new THREE.Color(POM), 0.55), { rim: 0.12, warm: 0.3 }),
      hood: feltMat('#9c96b5'), brim: feltMat('#787194'), tuft: feltMat(shade(body0, -0.25), { lift: shade(col, -0.2) }), pom: feltMat(POM, { rim: 0.2, warm: 0.2 }), shell: feltMat(SHELL, { rim: 0.3 }),
    };
    M.hood.side = THREE.DoubleSide;
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // body: a soft dumpling
    const prof = bigOne
      ? [[0, 0], [0.24, 0.015], [0.39, 0.08], [0.46, 0.21], [0.47, 0.36], [0.43, 0.51], [0.35, 0.63], [0.21, 0.71], [0, 0.735]]
      : [[0, 0], [0.22, 0.015], [0.36, 0.08], [0.43, 0.21], [0.445, 0.35], [0.415, 0.49], [0.34, 0.61], [0.21, 0.69], [0, 0.715]];
    body.add(P(lathe(prof), M.base, null, null, { ink: 0.02 }));
    body.add(P(G.sphere, M.belly, [0, 0.13, 0.36], [0.19, 0.105, 0.09], { ink: 0 }));
    // a felt seam: little stitches running down the side
    for (let i = 0; i < 6; i++) {
      const y = 0.12 + i * 0.075, r = Math.sqrt(Math.max(0, 0.2 - (y - 0.33) * (y - 0.33))) * 0.98, a = 0.95;
      const st = new THREE.Mesh(G.box, basic('#f4eef8'));
      st.scale.set(0.034, 0.011, 0.01); st.position.set(Math.sin(a) * r, y, Math.cos(a) * r); st.rotation.y = a; st.rotation.z = 0.3; body.add(st);
    }
    const feet = [-1, 1].map(s => body.add(P(G.sphere, M.dark, [s * 0.17, 0.035, 0.12], [0.12, 0.07, 0.14], { ink: 0.014 })));
    const arms = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.4, 0.32, 0.04); pv.rotation.z = s * 0.55; body.add(pv);
      pv.add(P(G.sphere, M.base, [0, -0.07, 0], [0.075, 0.11, 0.075], { ink: 0.014 }));
      return pv;
    });
    // face
    const face = new THREE.Group(); face.position.set(0, 0.395, bigOne ? 0.43 : 0.385); body.add(face);
    const fc = buildFace(face, 1, 0.15, bigOne ? 1.55 : 1.4);
    // hood: a nightcap worn on the back of the head, with a floppy point and a pompom
    // (the big one wears it further forward and smaller, so its shell and tail show behind it)
    const hood = new THREE.Group(); body.add(hood);
    if (bigOne) { hood.position.set(0, 0.5, 0.06); hood.rotation.x = -0.3; hood.scale.setScalar(0.8); }
    else { hood.position.set(0, 0.4, -0.06); hood.rotation.x = -0.62; }
    hood.add(P(new THREE.SphereGeometry(1, 26, 12, 0, TAU, 0, Math.PI * 0.43), M.hood, [0, 0, 0], [0.43, 0.45, 0.43], { ink: 0.016 }));
    hood.add(P(new THREE.TorusGeometry(0.42, 0.048, 8, 30), M.brim, [0, 0.1, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0.012 }));
    const tip = [];
    let prev = hood;
    [[0.17, 0.12, 0.2, 0.38], [0.12, 0.075, 0.19, 0], [0.075, 0.032, 0.18, 0]].forEach(([rb, rt, len, y], i) => {
      const s = new THREE.Group(); s.position.set(0, i ? prev.userData.len : y, i ? 0 : -0.06); prev.add(s);
      s.add(P(seg(rt, rb, len), M.hood, null, null, { ink: 0.012 }));
      s.userData.len = len; s.userData.rest = [-0.32, -0.42, -0.5][i];
      tip.push(s); prev = s;
    });
    const pom = P(G.ico1, M.pom, [0, tip[2].userData.len + 0.02, 0], [0.068, 0.068, 0.068], { ink: 0.01 }); tip[2].add(pom);
    // tail: a curl of felt with a darker tuft
    // (the big one's is long and curls up over its back, so it reads from any side)
    const tail = [];
    prev = body;
    const tailN = bigOne ? 6 : 4;
    for (let i = 0; i < tailN; i++) {
      const s = new THREE.Group(); s.position.set(0, i ? (bigOne ? 0.13 : 0.11) : bigOne ? 0.26 : 0.15, i ? 0 : bigOne ? -0.42 : -0.38); prev.add(s);
      const r = (bigOne ? 0.085 : 0.07) - i * (bigOne ? 0.006 : 0.008);
      s.add(P(G.sphere, M.base, [0, bigOne ? 0.065 : 0.055, 0], [r, bigOne ? 0.1 : 0.085, r], { ink: 0.012 }));
      s.userData.rest = i ? (bigOne ? 0.17 : 0.42) : (bigOne ? -0.62 : -1.15);
      tail.push(s); prev = s;
    }
    const tuft = P(G.ico1, M.tuft, [0, 0.14, 0], bigOne ? [0.14, 0.18, 0.14] : [0.11, 0.15, 0.11], { ink: 0.012 }); prev.add(tuft);
    // the big one's quilted shell, on its upper back
    let shell = null;
    if (bigOne) {
      const sg = new THREE.SphereGeometry(1, 10, 5, 0, TAU, 0, Math.PI / 2).toNonIndexed(); sg.computeVertexNormals();
      shell = new THREE.Group(); shell.position.set(0, 0.4, -0.2); shell.rotation.x = -1.12; body.add(shell);
      const sm = P(sg, M.shell, null, [0.42, 0.3, 0.4], { ink: 0.014 }); shell.add(sm);
      const seams = new THREE.LineSegments(new THREE.EdgesGeometry(sg, 12), new THREE.LineDashedMaterial({ color: '#e9e1f4', dashSize: 0.05, gapSize: 0.04 }));
      seams.scale.set(0.422, 0.302, 0.402); seams.computeLineDistances(); shell.add(seams);
    }
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.52, 0.3], 0.75);
    glowAt('tail', tail[tail.length - 1], [0, 0.14, 0], bigOne ? 0.6 : 0.5);
    if (shell) glowAt('shell', shell, [0, 0.32, 0], 0.85);
    // anchors (local positions for camera, labels, impacts)
    const anchors = anchorSet([['head', body, [0, 0.74, 0.1]], ['tail', tail[tail.length - 1], [0, 0.12, 0]], ['top', body, [0, 0.84, 0]], ['mid', body, [0, 0.36, 0.1]], ['face', face, [0, 0, 0]]]);
    if (shell) Object.assign(anchors, anchorSet([['shell', shell, [0, 0.3, 0]]]));
    const scale = bigOne ? 2.35 : o.size === 'big' ? 1.3 : 0.92;
    root.scale.setScalar(scale);
    return Object.assign({ kind, root, body, M, meshes, feet, arms, face, hood, tip, pom, tail, tuft, shell, glows, reticles, anchors, scale, big: bigOne, color: o.color,
      parts: bigOne ? ['head', 'tail', 'shell'] : ['head', 'tail'], radius: 0.42 * scale, height: 0.8 * scale, labelH: bigOne ? 1.12 : 0.98, hover: 0.95 }, fc);
  }

  // ------------------------------------------------------------ a moth
  const MOTH = '#958eae', MOTH_D = '#6b6487', FLUFF = '#ddd6ea';
  function buildMoth(o) {
    const col = COLORS[o.color] || COLORS.red, wing0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      base: feltMat(MOTH), dark: feltMat(MOTH_D), fluff: feltMat(FLUFF, { rim: 0.2, warm: 0.25 }),
      wing: feltMat(wing0, { rim: 0.1, lift: col }), edge: feltMat(shade(wing0, -0.32), { rim: 0.08, lift: shade(col, -0.25) }), spot: feltMat(POM, { rim: 0, warm: 0.2 }),
      ink: basic(INK),
    };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // body: a fuzzy bean with a striped tummy and a fluffy collar
    body.add(P(lathe([[0, 0], [0.13, 0.015], [0.23, 0.08], [0.29, 0.2], [0.3, 0.33], [0.27, 0.45], [0.19, 0.54], [0.1, 0.585], [0, 0.6]]), M.base, null, null, { ink: 0.018 }));
    [[0.075, 0.215], [0.155, 0.27]].forEach(([y, r]) => body.add(P(new THREE.TorusGeometry(r, 0.026, 6, 28), M.dark, [0, y, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0 })));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + 0.26, r = 0.29;
      body.add(P(G.ico1, M.fluff, [Math.sin(a) * r, 0.225 + (i % 2) * 0.018, Math.cos(a) * r], [0.07, 0.06, 0.07], { ink: 0.011 }));
    }
    // face, above the collar
    const face = new THREE.Group(); face.position.set(0, 0.45, 0.268); body.add(face);
    const fc = buildFace(face, 0.9, 0.12, 1.3);
    // feathery antennae, with springs (see pose)
    const antennae = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.09, 0.56, 0.08); pv.rotation.set(-0.35, 0, -s * 0.45); body.add(pv);
      pv.add(P(seg(0.011, 0.016, 0.2), M.dark, null, null, { ink: 0.008 }));
      const tip = new THREE.Group(); tip.position.y = 0.2; tip.rotation.z = -s * 0.5; pv.add(tip);
      tip.add(P(G.sphere, M.dark, [0, 0.07, 0], [0.034, 0.085, 0.014], { ink: 0.01 }));
      tip.add(P(G.sphere, M.fluff, [s * 0.012, 0.07, 0.006], [0.018, 0.06, 0.01], { ink: 0 }));
      pv.userData.rest = [-0.35, -s * 0.45];
      return pv;
    });
    // four wings, hinged at the shoulders; the left ones are mirrored
    const wings = [];
    for (const s of [1, -1]) {
      const up = new THREE.Group(); up.position.set(s * 0.1, 0.42, -0.13); up.scale.set(s * 1.18, 1.18, 1); body.add(up);
      up.add(wingCutout(UPPER, M, [0.37, 0.17, 0.072]));
      const lo = new THREE.Group(); lo.position.set(s * 0.08, 0.3, -0.15); lo.scale.set(s * 1.12, 1.12, 1); body.add(lo);
      lo.add(wingCutout(LOWER, M, [0.25, -0.15, 0.045]));
      wings.push({ g: up, s, upper: true, z: 0, y: 0 }, { g: lo, s, upper: false, z: 0, y: 0 });
    }
    // little legs, tucked under
    const legs = [[-0.07, 0.07, 0.14], [0.07, 0.07, 0.14], [-0.11, 0.06, 0.03], [0.11, 0.06, 0.03]].map(([x, y, z], i) => {
      const pv = new THREE.Group(); pv.position.set(x, y, z); pv.rotation.set(Math.PI - 0.35, 0, x > 0 ? -0.25 : 0.25); body.add(pv);
      pv.add(P(seg(0.01, 0.014, 0.1), M.dark, null, null, { ink: 0.007 }));
      pv.userData.rest = pv.rotation.x; pv.userData.i = i;
      return pv;
    });
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.5, 0.2], 0.6);
    glowAt('wing', wings[0].g, [0.3, 0.22, 0], 0.55);
    const anchors = anchorSet([['head', body, [0, 0.6, 0.14]], ['wing', wings[0].g, [0.3, 0.22, 0]], ['top', body, [0, 0.74, 0]], ['mid', body, [0, 0.32, 0.12]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.25 : 0.9;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'moth', root, body, M, meshes, face, antennae, wings, legs, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head', 'wing'], radius: 0.34 * scale, height: 0.6 * scale, labelH: 1.02, hover: 0.95 }, fc);
  }

  // ------------------------------------------------------------ a beetle
  const BEETLE = '#8f88a8', BEETLE_D = '#5f5879';
  function buildBeetle(o) {
    const col = COLORS[o.color] || COLORS.red, shell0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      base: feltMat(BEETLE), dark: feltMat(BEETLE_D), shell: feltMat(shell0, { rim: 0.3, lift: col }), spot: feltMat(new THREE.Color(shell0).lerp(new THREE.Color(POM), 0.45), { rim: 0.12, lift: shade(col, 0.45) }),
      knob: feltMat(shell0, { lift: col }), tuft: feltMat(shade(shell0, -0.22), { lift: shade(col, -0.15) }),
    };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // a low dark underbody
    body.add(P(G.sphere, M.dark, [0, 0.19, -0.03], [0.37, 0.15, 0.43], { ink: 0.016 }));
    // the shell: two wing cases that meet along the back (a dark seam shows between them)
    const shell = new THREE.Group(); shell.position.set(0, 0.2, -0.05); body.add(shell);
    const halves = [-1, 1].map(s => {
      const h = new THREE.Group(); shell.add(h);
      const geo = new THREE.SphereGeometry(1, 18, 12, s < 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI, 0, Math.PI / 2);
      h.add(P(geo, M.shell, null, [0.45, 0.4, 0.5], { ink: 0.016 }));
      // two pale spots on each case
      [[0.62, 0.55], [1.05, 0.35]].forEach(([th, k], i) => {
        const ph = s > 0 ? Math.PI + (i ? 0.6 : -0.75) : (i ? -0.6 : 0.75);   // one spot toward the front, one toward the back
        const n = new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
        const p = new THREE.Vector3(n.x * 0.45, n.y * 0.4, n.z * 0.5);
        const nn = new THREE.Vector3(n.x / 0.45, n.y / 0.4, n.z / 0.5).normalize();
        const sp = P(G.sphere, M.spot, [p.x + nn.x * 0.004, p.y + nn.y * 0.004, p.z + nn.z * 0.004], [0.075 * k + 0.035, 0.075 * k + 0.035, 0.018], { ink: 0.008 });
        sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nn);
        h.add(sp);
      });
      h.rotation.z = -s * 0.045; h.rotation.y = s * 0.03;
      h.userData.s = s;
      return h;
    });
    // head, with the face and two knobbed antennae in the shell's color
    const head = new THREE.Group(); head.position.set(0, 0.24, 0.38); body.add(head);
    head.add(P(G.sphere, M.base, [0, 0, 0.02], [0.23, 0.2, 0.2], { ink: 0.016 }));
    const face = new THREE.Group(); face.position.set(0, 0.035, 0.205); head.add(face);
    const fc = buildFace(face, 0.78, 0.095, 1.08);
    const antennae = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.08, 0.16, 0.06); pv.rotation.set(0.45, 0, -s * 0.5); head.add(pv);
      pv.add(P(seg(0.012, 0.016, 0.17), M.dark, null, null, { ink: 0.008 }));
      pv.add(P(G.ico1, M.knob, [0, 0.19, 0], [0.042, 0.042, 0.042], { ink: 0.01 }));
      pv.userData.rest = [0.45, -s * 0.5];
      return pv;
    });
    // six stubby legs (a tripod gait when it scuttles)
    const legs = [];
    [0.2, 0.0, -0.2].forEach((z, row) => [-1, 1].forEach(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.3, 0.12, z); body.add(pv);
      pv.rotation.z = -s * (Math.PI / 2 + 0.75); pv.rotation.y = s * (row - 1) * 0.35;   // front legs reach forward, back legs back
      pv.add(P(seg(0.03, 0.036, 0.12), M.dark, null, null, { ink: 0.01 }));
      pv.add(P(G.sphere, M.dark, [0, 0.13, 0], [0.042, 0.034, 0.046], { ink: 0.008 }));
      pv.userData = { s, row, rz: pv.rotation.z, ry: pv.rotation.y, tri: (row + (s > 0 ? 0 : 1)) % 2 };
      legs.push(pv);
    }));
    // a little curly tail peeking out under the shell (the Hush creatures all have one)
    const tail = [];
    let prev = body;
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Group(); s.position.set(0, i ? 0.085 : 0.15, i ? 0 : -0.47); prev.add(s);
      const r = 0.055 - i * 0.008;
      s.add(P(G.sphere, M.base, [0, 0.045, 0], [r, 0.07, r], { ink: 0.01 }));
      s.userData.rest = i ? 0.5 : -1.2;
      tail.push(s); prev = s;
    }
    const tuft = P(G.ico1, M.tuft, [0, 0.11, 0], [0.08, 0.11, 0.08], { ink: 0.01 }); prev.add(tuft);
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', head, [0, 0.06, 0.12], 0.55);
    glowAt('tail', tail[tail.length - 1], [0, 0.11, 0], 0.42);
    glowAt('shell', shell, [0, 0.42, 0], 0.8);
    const anchors = anchorSet([['head', head, [0, 0.2, 0.08]], ['tail', tail[tail.length - 1], [0, 0.1, 0]], ['shell', shell, [0, 0.42, 0]], ['top', body, [0, 0.72, 0]], ['mid', body, [0, 0.32, 0.2]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.35 : 1.02;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'beetle', root, body, M, meshes, head, face, shell, halves, antennae, legs, tail, tuft, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head', 'tail', 'shell'], radius: 0.46 * scale, height: 0.62 * scale, labelH: 0.8, hover: 0 }, fc);
  }

  // ------------------------------------------------------------ an armadillo
  // Its shell is a row of plates, each a strip of one sphere running from side to side over the back
  // (a lune with its poles on ±x): a big gray shield over the shoulders, three bands in its color, a
  // shield over the hips. Walking, the plates stand in a row and make a long dome; curling up, every
  // plate swings around the ball's center until they close into a ball (curl 0 → 1). The head tucks
  // in under the front shield with its eyes peeking out, the tail wraps underneath, the legs fold away.
  const ARM = '#8b84a3', ARM_D = '#645d84', ARM_P = '#b6afcc', BELLY = '#f1e4d2', EAR_IN = '#e8a7bd', NOSE = '#d9799a';
  const AR = 0.3, AY = 0.19;                  // the ball's radius (every plate's too), and the body's center height when it walks
  const A_FLIP_Y = AY + AR * 1.06;            // on its back, the top of its shell rests on the ground
  // [width, walking z, walking tilt, ball angle, material, radius]: angles turn from straight up toward the front (+z).
  // Five bands, colored and gray in turn, overlap like shingles between the two big shields.
  const A_PLATES = [[1.35, 0.13, 0.66, 1.575, 'plate', 1],
    [0.38, 0.08, 0.24, 0.72, 'band', 1.06], [0.38, 0.04, 0.12, 0.36, 'plate', 1.04], [0.38, 0, 0, 0, 'band', 1.06],
    [0.38, -0.04, -0.12, -0.36, 'plate', 1.04], [0.38, -0.08, -0.24, -0.72, 'band', 1.06],
    [1.35, -0.13, -0.66, -1.575, 'plate', 1]];
  // the head and tail: [y, z, tilt] walking and curled (in the spin group, whose origin is the ball's center)
  const A_HEAD = { walk: [AY - AR + 0.075, 0.43, 0.08], ball: [-0.205, 0.15, 0.3] };
  const A_TAIL = { walk: [AY - AR + 0.03, -0.4, -0.25, 0.1], ball: [-0.216, -0.162, -2.5, -0.28] };
  const A_TAIL_LEN = 0.075;
  function lune(w, cut = 0.13) {
    const g = new THREE.SphereGeometry(1, Math.max(5, Math.round(w * 9)), 12, -w / 2, w, cut, Math.PI - 2 * cut);
    g.rotateZ(-Math.PI / 2);
    return g;
  }
  function buildArmadillo(o) {
    const col = COLORS[o.color] || COLORS.red, band0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      base: feltMat(ARM), dark: feltMat(ARM_D), plate: feltMat(ARM_P, { rim: 0.28 }), band: feltMat(band0, { rim: 0.3, lift: col }),
      ring: feltMat(shade(band0, -0.12), { lift: shade(col, -0.08) }), belly: feltMat(BELLY, { rim: 0.12, warm: 0.2 }), ear: feltMat(EAR_IN, { rim: 0.1, warm: 0.15 }),
      nose: feltMat(NOSE, { rim: 0.2, warm: 0.1 }),
    };
    M.plate.side = THREE.DoubleSide; M.band.side = THREE.DoubleSide;
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // everything that curls lives in the spin group, centered on the ball (it turns when the ball rolls)
    const spin = new THREE.Group(); spin.position.set(0, AR, 0); body.add(spin);
    const under = P(G.sphere, M.base, null, [0.27, 0.165, 0.38], { ink: 0.014 }); spin.add(under);
    const belly = P(G.sphere, M.belly, null, [0.22, 0.12, 0.31], { ink: 0 }); spin.add(belly);
    const plates = A_PLATES.map(([w, zw, aw, ab, mat, r]) => {
      const g = new THREE.Group(); spin.add(g);
      g.add(P(lune(w), M[mat], null, [AR * r, AR * r, AR * r], { ink: 0.012 }));
      return { g, zw, aw, ab };
    });
    // the head: a round skull with a gray cap, a long snout with a pink nose, big ears, and the face
    const head = new THREE.Group(); spin.add(head);
    head.add(P(G.sphere, M.base, null, [0.14, 0.13, 0.15], { ink: 0.014 }));
    head.add(P(lune(1.5, 0.45), M.plate, [0, 0.008, -0.01], [0.15, 0.142, 0.158], { rot: [-0.12, 0, 0], ink: 0.01 }));
    head.add(P(new THREE.CylinderGeometry(0.034, 0.068, 0.2, 14), M.base, [0, -0.035, 0.17], null, { rot: [Math.PI / 2, 0, 0], ink: 0.012 }));
    head.add(P(G.sphere, M.nose, [0, -0.033, 0.272], [0.042, 0.036, 0.03], { ink: 0.01 }));
    const ears = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.078, 0.095, -0.03); pv.rotation.set(-0.15, 0, -s * 0.32); head.add(pv);
      pv.add(P(G.sphere, M.base, [0, 0.06, 0], [0.042, 0.07, 0.02], { ink: 0.01 }));
      pv.add(P(G.sphere, M.ear, [0, 0.058, 0.012], [0.026, 0.048, 0.01], { ink: 0 }));
      pv.userData.rest = -s * 0.32; pv.userData.s = s;
      return pv;
    });
    const face = new THREE.Group(); face.position.set(0, 0.035, 0.125); head.add(face);
    const fc = buildFace(face, 0.6, 0.062, 0.64);
    fc.mouth.position.set(0, -0.1, 0.11); fc.tongue.position.set(0, -0.112, 0.116);   // the mouth sits under the snout
    // the tail: banded, tapering
    const tail = [];
    let prev = spin;
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Group(); if (i) s.position.set(0, 0, -A_TAIL_LEN); prev.add(s);
      const rb = 0.052 - i * 0.008, rt = rb - 0.008;
      const geo = new THREE.CylinderGeometry(rt, rb, A_TAIL_LEN + 0.012, 10); geo.translate(0, A_TAIL_LEN / 2, 0); geo.rotateX(-Math.PI / 2);
      s.add(P(geo, M.base, null, null, { ink: 0.009 }));
      if (i % 2 === 0) { const rg = new THREE.CylinderGeometry(rb + 0.006, rb + 0.008, 0.026, 10); rg.rotateX(-Math.PI / 2); s.add(P(rg, M.ring, [0, 0, -0.012], null, { ink: 0.008 })); }
      tail.push(s); prev = s;
    }
    const tip = P(G.sphere, M.base, [0, 0, -A_TAIL_LEN], [0.016, 0.016, 0.02], { ink: 0.008 }); prev.add(tip);
    // four stubby legs (they trot in diagonal pairs)
    const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([s, f]) => {
      const pv = new THREE.Group(); body.add(pv);
      pv.add(P(new THREE.CylinderGeometry(0.048, 0.042, 0.13, 10).translate(0, -0.065, 0), M.base, null, null, { ink: 0.01 }));
      pv.add(P(G.sphere, M.dark, [0, -0.13, 0.015], [0.05, 0.03, 0.06], { ink: 0.008 }));
      pv.userData = { x: s * 0.16, y: AY - 0.03, z: f * 0.2, diag: (s * f) > 0 };
      pv.position.set(pv.userData.x, pv.userData.y, pv.userData.z);
      return pv;
    });
    const glows = {}, reticles = {};
    // 'top' and 'mid' hang on the root, so they stay put while it rolls or flips; head and tail follow the pose
    const anchors = anchorSet([['top', root, [0, 0.72, 0]], ['mid', root, [0, 0.3, 0.1]], ['head', head, [0, 0.06, 0.12]], ['tail', tail[tail.length - 1], [0, 0, -A_TAIL_LEN]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.25 : 0.9;
    root.scale.setScalar(scale);
    const h = Object.assign({ kind: 'armadillo', root, body, spin, M, meshes, head, face, ears, plates, under, belly, tail, legs, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head', 'tail'], radius: 0.36 * scale, height: 0.62 * scale, labelH: 0.84, hover: 0 }, fc);
    return h;
  }

  // ------------------------------------------------------------ a frog
  // A round lump sitting on its haunches, higher at the front. The back and the top of the head are in its color,
  // with pale spots; the eyes sit on two bumps on top of its head; a wide ink smile runs round the front; under the
  // chin, a pale throat that puffs. Back legs fold at its sides (they kick out when it leaps: F.leapS follows its
  // vertical speed, or F.leap), and a long pink tongue (h.lash, on the root so squash doesn't bend it) shoots out.
  const FROG = '#8f89a6', THROAT = '#f4e8d8';
  function buildFrog(o) {
    const col = COLORS[o.color] || COLORS.red, back0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      base: feltMat(FROG), dark: feltMat('#6d6689'),
      back: feltMat(back0, { rim: 0.3, lift: col }),
      spot: feltMat(new THREE.Color(back0).lerp(new THREE.Color(POM), 0.5), { rim: 0.12, lift: shade(col, 0.5) }),
      throat: feltMat(THROAT, { rim: 0.14, warm: 0.2 }),
      belly: feltMat(new THREE.Color(FROG).lerp(new THREE.Color(POM), 0.6), { rim: 0.12, warm: 0.25 }),
      tongue: feltMat('#e9788f', { rim: 0.2, warm: 0.05, noTex: true }),
    };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // the body, tipped up at the front, with its colored back and pale spots on it
    const trunk = new THREE.Group(); trunk.position.set(0, 0.26, -0.06); trunk.rotation.x = -0.3; body.add(trunk);
    trunk.add(P(G.sphere, M.base, null, [0.4, 0.29, 0.44], { ink: 0.018 }));
    const BR = [0.412, 0.302, 0.452];
    trunk.add(P(new THREE.SphereGeometry(1, 26, 12, 0, TAU, 0, Math.PI * 0.47), M.back, null, BR, { ink: 0.014 }));
    trunk.add(P(G.sphere, M.belly, [0, -0.08, 0.17], [0.29, 0.17, 0.27], { ink: 0 }));
    [[0.5, 0.35, 1.0], [0.9, 2.1, 0.85], [0.85, 4.0, 0.95], [0.5, 5.4, 0.75], [1.05, 0.95, 0.65], [1.08, 3.2, 0.7], [0.22, 3.1, 0.6], [1.1, 5.9, 0.6]].forEach(([th, ph, k]) => {
      const n = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
      const p = new THREE.Vector3(n.x * BR[0], n.y * BR[1], n.z * BR[2]);
      const nn = new THREE.Vector3(n.x / BR[0], n.y / BR[1], n.z / BR[2]).normalize();
      const sp = P(G.sphere, M.spot, [p.x + nn.x * 0.004, p.y + nn.y * 0.004, p.z + nn.z * 0.004], [0.062 * k, 0.062 * k, 0.016], { ink: 0.008 });
      sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nn);
      trunk.add(sp);
    });
    // the head: gray in front, its color on top, two eye bumps, a wide smile and the throat under it
    const head = new THREE.Group(); head.position.set(0, 0.39, 0.2); body.add(head);
    head.add(P(G.sphere, M.base, null, [0.34, 0.24, 0.3], { ink: 0.016 }));
    head.add(P(new THREE.SphereGeometry(1, 24, 10, 0, TAU, 0, Math.PI * 0.4), M.back, null, [0.352, 0.252, 0.312], { rot: [-0.45, 0, 0], ink: 0.012 }));
    // big round eye bumps, standing up out of the head
    const bumps = [-1, 1].map(s => { const b = P(G.sphere, M.back, [s * 0.155, 0.19, 0.075], [0.135, 0.135, 0.13], { ink: 0.013 }); head.add(b); return b; });
    const face = new THREE.Group(); face.position.set(0, 0.19, 0.2); head.add(face);
    const fc = buildFace(face, 1, 0.155, 1.38);
    fc.mouth.position.set(0, -0.21, 0.095); fc.tongue.position.set(0, -0.224, 0.099);
    const smile = new THREE.CatmullRomCurve3([[-0.27, 0.04, 0.2], [-0.19, -0.015, 0.262], [0, -0.04, 0.302], [0.19, -0.015, 0.262], [0.27, 0.04, 0.2]].map(v => new THREE.Vector3(...v)));
    head.add(new THREE.Mesh(new THREE.TubeGeometry(smile, 24, 0.011, 5, false), basic(INK)));
    const throat = P(G.sphere, M.throat, [0, -0.13, 0.16], [0.16, 0.11, 0.13], { ink: 0.012 }); head.add(throat);
    // front legs (from the shoulders, splayed a little), and the big back legs folded at its sides (from the hips)
    const toes = (pv, x, y, z, s) => [-1, 0, 1].forEach(k => pv.add(P(G.ico1, M.base, [x + k * 0.035 * s, y, z + 0.06 * s], [0.024 * s, 0.018 * s, 0.026 * s], { ink: 0.006 })));
    const arms = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.16, 0.22, 0.24); pv.rotation.z = s * 0.28; body.add(pv);
      pv.add(P(G.cyl, M.base, [0, -0.1, 0.01], [0.045, 0.2, 0.045], { ink: 0.01 }));
      const hand = new THREE.Group(); hand.position.set(0, -0.2, 0.02); hand.rotation.z = -s * 0.28; pv.add(hand);   // the hand lies flat
      hand.add(P(G.sphere, M.base, [0, 0, 0.04], [0.07, 0.025, 0.08], { ink: 0.008 }));
      toes(hand, 0, 0, 0.06, 0.9);
      return pv;
    });
    const legs = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.24, 0.195, -0.18); body.add(pv);
      pv.add(P(G.sphere, M.base, [s * 0.06, -0.04, 0.06], [0.15, 0.13, 0.22], { ink: 0.014, rot: [0, s * 0.3, 0] }));
      pv.add(P(G.sphere, M.back, [s * 0.075, 0.03, 0.03], [0.11, 0.07, 0.15], { ink: 0.01, rot: [0, s * 0.3, 0] }));   // a stripe of color on the thigh
      pv.add(P(G.sphere, M.base, [s * 0.1, -0.13, 0.14], [0.06, 0.05, 0.17], { ink: 0.01 }));
      pv.add(P(G.sphere, M.base, [s * 0.11, -0.18, 0.24], [0.08, 0.025, 0.16], { ink: 0.008 }));
      toes(pv, s * 0.11, -0.18, 0.31, 1.1);
      return pv;
    });
    // the tongue: rolled out along +z from the mouth to F.lash (in the frog's own units), aimed with F.lashYaw / F.lashPitch
    const lash = new THREE.Group(); lash.position.set(0, 0.37, 0.49); lash.rotation.order = 'YXZ'; lash.visible = false; root.add(lash);
    // (lashTongue, not tongue: buildFace's little tongue in the open mouth is h.tongue)
    const tg = new THREE.CylinderGeometry(0.045, 0.058, 1, 8); tg.rotateX(Math.PI / 2); tg.translate(0, 0, 0.5);
    const lashTongue = P(tg, M.tongue, null, null, { ink: 0.008 }); lash.add(lashTongue);
    const lashTip = P(G.sphere, M.tongue, null, [0.095, 0.075, 0.095], { ink: 0.01 }); lash.add(lashTip);
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', head, [0, 0.18, 0.08], 0.55);
    const anchors = anchorSet([['head', head, [0, 0.3, 0.05]], ['top', body, [0, 0.82, 0]], ['mid', body, [0, 0.3, 0.12]], ['face', face, [0, 0, 0]], ['mouth', root, [0, 0.37, 0.49]], ['throat', head, [0, -0.13, 0.2]]]);
    const scale = o.size === 'big' ? 1.3 : 0.95;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'frog', root, body, M, meshes, trunk, head, face, bumps, throat, arms, legs, lash, lashTongue, lashTip, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head'], radius: 0.42 * scale, height: 0.72 * scale, labelH: 0.9, hover: 0 }, fc);
  }

  // ------------------------------------------------------------ a training dummy (Bruno's yard)
  // A straw-stuffed burlap sack on a wooden post, on a cross of boards: a sack head with a painted face and a tuft of
  // straw, two stick arms with straw hands, a painted target on its belly, and a scarf in its color (the color word
  // you aim with). It wobbles on its post (F.wobX / F.wobZ, kicked by F.wobVX / F.wobVZ), spins when it's hit (F.spinV),
  // and lifts or drops its arms to telegraph a swing (F.swing: 1 high … −1 low).
  const BURLAP = '#cfb487', STRAW = '#ecd27c', WOOD = '#8b6340';
  function buildDummy(o) {
    const col = COLORS[o.color] || COLORS.red;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      sack: feltMat(BURLAP, { warm: 0.3 }), wood: feltMat(WOOD, { noTex: true, rim: 0.15, warm: 0.2 }), straw: feltMat(STRAW, { rim: 0.12, warm: 0.2 }),
      scarf: feltMat(col, { rim: 0.25 }), rope: feltMat('#8a6a42', { noTex: true, rim: 0.1 }),   // (full color: straw dummies aren't Hush)
      ink: feltMat('#5a4a3a', { noTex: true, rim: 0.05, warm: 0.1 }), cream: feltMat('#fbf3e3', { noTex: true, rim: 0.1, warm: 0.1 }),
    };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // the base stays put; everything on the post wobbles (body pivots at the ground)
    [Math.PI / 4, -Math.PI / 4].forEach(r => root.add(P(G.box, M.wood, [0, 0.03, 0], [0.72, 0.06, 0.14], { rot: [0, r, 0], ink: 0.01 })));
    body.add(P(G.cyl, M.wood, [0, 0.5, 0], [0.05, 1.0, 0.05], { ink: 0.01 }));
    body.add(P(lathe([[0, 0.3], [0.18, 0.32], [0.27, 0.42], [0.29, 0.56], [0.26, 0.7], [0.18, 0.8], [0.08, 0.84], [0, 0.85]]), M.sack, null, null, { ink: 0.018 }));
    body.add(P(new THREE.TorusGeometry(0.283, 0.018, 6, 26), M.rope, [0, 0.47, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    // a target painted on its belly (in browns and cream, so it never reads as a color word)
    [[0.13, M.cream], [0.095, M.ink], [0.06, M.cream], [0.028, M.ink]].forEach(([r, m], i) => body.add(P(G.cyl, m, [0, 0.61, 0.272 + i * 0.004], [r, 0.01, r], { rot: [Math.PI / 2 - 0.12, 0, 0], ink: 0 })));
    // arms: sticks from the shoulders with straw hands
    const arms = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.12, 0.72, 0); body.add(pv);
      pv.add(P(G.cyl, M.wood, [s * 0.22, 0, 0], [0.028, 0.44, 0.028], { rot: [0, 0, Math.PI / 2], ink: 0.008 }));
      [0, 0.5, -0.5].forEach(k => pv.add(P(G.cone, M.straw, [s * 0.47, k * 0.03, k * 0.02], [0.035, 0.13, 0.035], { rot: [0, 0, -s * (Math.PI / 2 - k * 0.5)], ink: 0.006 })));
      return pv;
    });
    // a big scarf in its color (the color word you aim with), its two tails hanging in front
    const scarf = new THREE.Group(); scarf.position.set(0, 0.85, 0); body.add(scarf);
    scarf.add(P(new THREE.TorusGeometry(0.15, 0.064, 8, 24), M.scarf, null, [1, 1, 0.82], { rot: [Math.PI / 2, 0, 0], ink: 0.014 }));
    scarf.add(P(G.box, M.scarf, [0.09, -0.16, 0.15], [0.11, 0.3, 0.03], { rot: [0.22, 0, 0.16], ink: 0.012 }));
    scarf.add(P(G.box, M.scarf, [-0.01, -0.13, 0.17], [0.1, 0.24, 0.03], { rot: [0.3, 0, -0.12], ink: 0.012 }));
    // the sack head, its painted face, a rope tie and a tuft of straw
    const head = new THREE.Group(); head.position.set(0, 1.0, 0); body.add(head);
    head.add(P(G.sphere, M.sack, null, [0.2, 0.19, 0.19], { ink: 0.016 }));
    head.add(P(new THREE.TorusGeometry(0.07, 0.014, 6, 16), M.rope, [0, -0.17, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; head.add(P(G.cone, M.straw, [Math.sin(a) * 0.05, 0.19, Math.cos(a) * 0.05 - 0.02], [0.03, 0.12, 0.03], { rot: [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5], ink: 0.006 })); }
    const face = new THREE.Group(); face.position.set(0, 0.0, 0.17); head.add(face);
    const fc = buildFace(face, 0.75, 0.075, 1.0);
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', head, [0, 0, 0.1], 0.5);
    const anchors = anchorSet([['head', head, [0, 0.08, 0.05]], ['top', body, [0, 1.32, 0]], ['mid', body, [0, 0.6, 0.22]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.25 : 1.0;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'dummy', root, body, M, meshes, head, face, arms, scarf, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head'], radius: 0.3 * scale, height: 1.2 * scale, labelH: 1.26, hover: 0 }, fc);
  }

  // ------------------------------------------------------------ a kernel soldier (the Corn Society)
  // A corn kernel on little legs: a glossy tooth shape in its corn color, a pale germ on its belly, a face, a helmet
  // made of husk, and a toothpick for a spear.
  function buildKernel(o) {
    const col = COLORS[o.color] || COLORS.yellow, k0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      skin: feltMat(k0, { rim: 0.38, lift: col }), germ: feltMat(new THREE.Color(k0).lerp(new THREE.Color(POM), 0.62), { rim: 0.12, warm: 0.2 }),
      husk: feltMat('#b6c178', { rim: 0.2, warm: 0.15 }), base: feltMat(BASE), dark: feltMat(BASE_D), wood: feltMat('#cfa86f', { noTex: true, rim: 0.12 }),
    };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    body.add(P(lathe([[0, 0.12], [0.06, 0.13], [0.13, 0.19], [0.21, 0.31], [0.26, 0.45], [0.27, 0.56], [0.24, 0.65], [0.15, 0.71], [0, 0.73]]), M.skin, null, [1, 1, 0.8], { ink: 0.016 }));
    body.add(P(G.sphere, M.germ, [0, 0.29, 0.165], [0.085, 0.12, 0.03], { rot: [0.35, 0, 0], ink: 0 }));
    const feet = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.08, 0.15, 0); body.add(pv);
      pv.add(P(G.cyl, M.base, [0, -0.07, 0], [0.03, 0.14, 0.03], { ink: 0.008 }));
      pv.add(P(G.sphere, M.dark, [0, -0.14, 0.03], [0.05, 0.03, 0.065], { ink: 0.008 }));
      return pv;
    });
    const arms = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.25, 0.44, 0); pv.rotation.z = s * 0.5; body.add(pv);
      pv.add(P(G.sphere, M.base, [0, -0.07, 0], [0.04, 0.08, 0.04], { ink: 0.008 }));
      return pv;
    });
    // a toothpick spear in the right hand
    const spear = new THREE.Group(); spear.position.set(0.02, -0.13, 0.03); spear.rotation.set(-0.25, 0, -0.45); arms[1].add(spear);
    spear.add(P(G.cyl, M.wood, [0, 0.16, 0], [0.012, 0.5, 0.012], { ink: 0.005 }));
    spear.add(P(G.cone, M.wood, [0, 0.43, 0], [0.018, 0.06, 0.018], { ink: 0.005 }));
    // the husk helmet, with a leafy point
    const helmet = new THREE.Group(); helmet.position.set(0, 0.63, -0.01); helmet.rotation.x = -0.18; body.add(helmet);
    helmet.add(P(new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, Math.PI * 0.42), M.husk, null, [0.19, 0.13, 0.17], { ink: 0.01 }));
    helmet.add(P(new THREE.TorusGeometry(0.17, 0.022, 6, 20), M.husk, [0, 0.0, 0], [1, 1, 0.9], { rot: [Math.PI / 2, 0, 0], ink: 0.008 }));
    helmet.add(P(G.cone, M.husk, [0, 0.14, -0.03], [0.05, 0.14, 0.04], { rot: [-0.45, 0, 0], ink: 0.008 }));
    const face = new THREE.Group(); face.position.set(0, 0.48, 0.205); body.add(face);
    const fc = buildFace(face, 0.72, 0.08, 1.0);
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.55, 0.15], 0.45);
    const anchors = anchorSet([['head', body, [0, 0.62, 0.08]], ['top', body, [0, 0.86, 0]], ['mid', body, [0, 0.42, 0.15]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.15 : 0.88;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'kernel', root, body, M, meshes, face, feet, arms, spear, helmet, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head'], radius: 0.27 * scale, height: 0.76 * scale, labelH: 0.86, hover: 0 }, fc);
  }

  // ------------------------------------------------------------ popcorn (a kernel that popped on the hot floor)
  // A fluffy cluster of white puffs with the kernel's colored hull still stuck to its bottom (its color), a face and
  // little legs. It bounces.
  function buildPopcorn(o) {
    const col = COLORS[o.color] || COLORS.yellow, k0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = { puff: feltMat('#fcf4e0', { rim: 0.22, warm: 0.12 }), puffD: feltMat('#f1e2bd', { rim: 0.15, warm: 0.1 }), hull: feltMat(k0, { rim: 0.36, lift: col }), base: feltMat(BASE), dark: feltMat(BASE_D) };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    [[0, 0.44, 0.07, 0.23, 'puff'], [0.18, 0.5, -0.01, 0.17, 'puff'], [-0.18, 0.48, 0.01, 0.18, 'puffD'], [0.08, 0.65, -0.05, 0.16, 'puff'], [-0.1, 0.63, -0.01, 0.15, 'puff'],
      [0.13, 0.33, -0.1, 0.14, 'puffD'], [-0.12, 0.31, -0.08, 0.15, 'puff']].forEach(([x, y, z, r, m]) => body.add(P(G.ico1, M[m], [x, y, z], [r, r * 0.92, r], { ink: 0.012 })));
    // the hull: a cup of the kernel's skin under it, and a flake on top
    body.add(P(new THREE.SphereGeometry(1, 18, 8, 0, TAU, Math.PI * 0.45, Math.PI * 0.55), M.hull, [0, 0.3, -0.02], [0.24, 0.2, 0.22], { ink: 0.014 }));
    body.add(P(G.sphere, M.hull, [-0.05, 0.75, -0.1], [0.06, 0.02, 0.05], { rot: [0.4, 0, 0.3], ink: 0.006 }));
    const feet = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.09, 0.14, 0.02); body.add(pv);
      pv.add(P(G.cyl, M.base, [0, -0.06, 0], [0.03, 0.12, 0.03], { ink: 0.008 }));
      pv.add(P(G.sphere, M.dark, [0, -0.12, 0.03], [0.05, 0.03, 0.065], { ink: 0.008 }));
      return pv;
    });
    const face = new THREE.Group(); face.position.set(0, 0.47, 0.285); body.add(face);
    const fc = buildFace(face, 0.7, 0.08, 0.95);
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.55, 0.2], 0.45);
    const anchors = anchorSet([['head', body, [0, 0.66, 0.08]], ['top', body, [0, 0.86, 0]], ['mid', body, [0, 0.44, 0.18]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.15 : 0.9;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'popcorn', root, body, M, meshes, face, feet, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head'], radius: 0.3 * scale, height: 0.8 * scale, labelH: 0.9, hover: 0 }, fc);
  }

  // ------------------------------------------------------------ Colonel Cob, leader of the Corn Society
  // A big corn cob on two boots: rows of golden kernels, big eyes under fierce brows, a corn-silk tassel mustache, a
  // tiny officer's cap and a medal on his chest, all wrapped in a cape of husk leaves. F.cape (0 → 1) opens the cape like
  // a peeled ear of corn (then his medal shows); F.surrender (0 → 1) slumps him down, waving a white flag.
  const cobTex = (() => {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128;
    const c = cv.getContext('2d');
    c.fillStyle = '#b8902c'; c.fillRect(0, 0, 64, 128);
    for (let row = 0; row < 12; row++) for (let k = 0; k < 4; k++) {
      const x = k * 16 + (row % 2) * 8, y = row * 10.7;
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x + 8, y + 5.6, 6.6, 4.7, 0, 0, TAU); c.fill();
      c.fillStyle = '#fff7da'; c.beginPath(); c.ellipse(x + 6, y + 4, 2.4, 1.4, -0.4, 0, TAU); c.fill();
      if (x + 8 > 56) { c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(x + 8 - 64, y + 5.6, 6.6, 4.7, 0, 0, TAU); c.fill(); }
    }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1);
    return t;
  })();
  function cobMat(color, lift) {
    const m = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: TK.grad, map: cobTex });
    m.onBeforeCompile = sh => {
      sh.uniforms.rimAmt = { value: 0.3 };
      sh.fragmentShader = 'uniform float rimAmt;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>',
        'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\n' +
        'gl_FragColor.rgb += vec3(1.0, 0.95, 0.86) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
    };
    m.customProgramCacheKey = () => 'cobrim';
    m.userData.base = m.color.clone(); m.userData.lift = new THREE.Color(lift || color);
    return m;
  }
  function buildColonel(o) {
    const col = COLORS[o.color] || COLORS.yellow;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      cob: cobMat(hushed(col), col), husk: feltMat('#4f7a30', { rim: 0.14, warm: 0.02 }), huskD: feltMat('#426a2a', { rim: 0.12, warm: 0.02 }), huskIn: feltMat('#cfc98c', { rim: 0.1, warm: 0.1 }),
      silk: feltMat('#dcae52', { rim: 0.2, warm: 0.1 }), silkD: feltMat('#b4832f', { rim: 0.15 }), cap: feltMat('#3f5d43', { rim: 0.2 }), band: feltMat('#2f3b30', { noTex: true, rim: 0.1 }),
      gold: feltMat('#ffcf45', { noTex: true, rim: 0.4, warm: 0.05, emissive: '#3a2a00' }), red: feltMat('#c84b3f', { noTex: true, rim: 0.15 }), boot: feltMat('#5e4030', { rim: 0.15 }),
      white: feltMat('#fbf6ea', { rim: 0.1, warm: 0.1 }), wood: feltMat('#a07a50', { noTex: true, rim: 0.1 }),
    };
    M.husk.side = THREE.DoubleSide; M.huskD.side = THREE.DoubleSide;
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // the cob
    body.add(P(lathe([[0, 0.1], [0.2, 0.12], [0.3, 0.22], [0.34, 0.4], [0.345, 0.62], [0.32, 0.83], [0.25, 0.99], [0.13, 1.08], [0, 1.1]], 26), M.cob, null, null, { ink: 0.018 }));
    [-1, 1].forEach(s => body.add(P(G.sphere, M.boot, [s * 0.13, 0.06, 0.06], [0.11, 0.07, 0.15], { ink: 0.012 })));
    // the medal on his chest (it shows when the cape opens)
    body.add(P(G.box, M.red, [0, 0.62, 0.33], [0.07, 0.1, 0.02], { rot: [-0.08, 0, 0], ink: 0.006 }));
    body.add(P(G.box, M.white, [0, 0.62, 0.335], [0.022, 0.1, 0.022], { ink: 0 }));
    const medal = P(G.cyl, M.gold, [0, 0.53, 0.345], [0.065, 0.025, 0.065], { rot: [Math.PI / 2 - 0.1, 0, 0], ink: 0.008 }); body.add(medal);
    // the face, the tassel mustache, the officer's cap
    const face = new THREE.Group(); face.position.set(0, 0.92, 0.272); body.add(face);
    const fc = buildFace(face, 1.12, 0.105, 1.3);
    fc.mouth.position.set(0, -0.14, 0.0); fc.tongue.position.set(0, -0.155, 0.006);
    const stache = [-1, 1].map(s => {
      const g = new THREE.Group(); g.position.set(0, 0.81, 0.305); body.add(g);
      const curve = new THREE.CatmullRomCurve3([[0, 0, 0.012], [s * 0.09, -0.02, 0.0], [s * 0.18, 0.0, -0.03], [s * 0.24, 0.06, -0.07], [s * 0.22, 0.11, -0.08]].map(v => new THREE.Vector3(...v)));
      g.add(P(new THREE.TubeGeometry(curve, 16, 0.035, 7, false), M.silk, null, null, { ink: 0.008 }));
      [0.25, 0.55].forEach(k => { const p = curve.getPoint(k); g.add(P(G.cone, M.silkD, [p.x, p.y - 0.04, p.z + 0.01], [0.014, 0.08, 0.014], { rot: [0, 0, s * 0.3], ink: 0 })); });
      return g;
    });
    const cap = new THREE.Group(); cap.position.set(0.02, 1.07, 0.0); cap.rotation.set(-0.12, 0, -0.14); body.add(cap);
    cap.add(P(G.cyl, M.cap, [0, 0.06, 0], [0.13, 0.11, 0.13], { ink: 0.01 }));
    cap.add(P(G.cyl, M.band, [0, 0.025, 0], [0.135, 0.035, 0.135], { ink: 0 }));
    cap.add(P(new THREE.SphereGeometry(1, 14, 6, 0, TAU, Math.PI / 2, Math.PI / 2), M.band, [0, 0.02, 0.11], [0.1, 0.03, 0.08], { rot: [0.2, 0, 0], ink: 0.006 }));
    cap.add(P(G.sphere, M.gold, [0, 0.07, 0.125], [0.03, 0.03, 0.012], { ink: 0.004 }));
    // little leaf arms (they show when the cape is open)
    const arms = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.32, 0.66, 0.06); pv.rotation.z = s * 0.4; body.add(pv);
      pv.add(P(G.sphere, M.husk, [0, -0.13, 0], [0.06, 0.15, 0.06], { ink: 0.008 }));
      return pv;
    });
    // the white flag he waves when he gives up (hidden till then)
    // (the pole runs on from his hand, away from the shoulder, so with the arm up it points up, the cloth at its top)
    const flag = new THREE.Group(); flag.position.set(0, -0.22, 0.04); flag.visible = false; arms[1].add(flag);
    flag.add(P(G.cyl, M.wood, [0, -0.38, 0], [0.016, 0.8, 0.016], { ink: 0.005 }));
    const cloth = P(G.box, M.white, [-0.15, -0.66, 0], [0.28, 0.19, 0.012], { ink: 0.006 }); flag.add(cloth);
    // the husk cape: five leaves hinged on a ring at his shoulders; F.cape swings them out like a peeled ear of corn.
    // Each leaf narrows to a point at the bottom, and every other one sits a little further out, so they overlap in layers.
    const cape = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + TAU / 10;           // seams at the front, so it opens in front of him
      const g = new THREE.Group(); g.position.set(Math.sin(a) * 0.36, 0.71, Math.cos(a) * 0.36); g.rotation.y = a; body.add(g);
      g.userData.a = a;                              // (poseColonel slides the front two round to the sides as it opens)
      const out = i % 2 ? 0.028 : 0, r0 = 0.36 + out, r1 = 0.5 + out;
      const geo = new THREE.CylinderGeometry(r0, r1, 0.8, 13, 6, true, -0.72, 1.44);
      const pa = geo.attributes.position;
      for (let v = 0; v < pa.count; v++) {
        const x = pa.getX(v), y = pa.getY(v), z = pa.getZ(v), u = clamp((Math.atan2(x, z) + 0.72) / 1.44, 0, 1), depth = clamp((0.4 - y) / 0.8, 0, 1);
        pa.setY(v, y + Math.pow(depth, 2.2) * 0.3 * Math.pow(Math.abs(2 * u - 1), 1.3));   // the pointed tip
      }
      geo.computeVertexNormals();
      geo.translate(0, -0.4, -0.36);
      g.add(P(geo, i % 2 ? M.huskD : M.husk, null, null, { ink: 0 }));
      g.add(P(G.box, M.huskIn, [0, -0.36, 0.077 + out], [0.012, 0.6, 0.012], { rot: [-0.17, 0, 0], ink: 0 }));   // a vein down the middle
      cape.push(g);
    }
    body.add(P(new THREE.TorusGeometry(0.37, 0.036, 6, 24), M.husk, [0, 0.71, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0.01 }));
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.95, 0.25], 0.6);
    const anchors = anchorSet([['head', body, [0, 1.0, 0.12]], ['top', body, [0, 1.32, 0]], ['mid', body, [0, 0.55, 0.32]], ['face', face, [0, 0, 0]], ['medal', body, [0, 0.53, 0.37]],
      ['hands', body, [0.3, 0.6, 0.3]]]);
    const scale = 1.9;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'colonel', root, body, M, meshes, face, stache, cap, arms, flag, cloth, cape, medal, glows, reticles, anchors, scale, big: true, color: o.color,
      parts: ['head'], radius: 0.46 * scale, height: 1.2 * scale, labelH: 1.28, hover: 0 }, fc);
  }

  // ------------------------------------------------------------ food (for eating in battle): small props, about 0.3 units across
  function buildFood(id) {
    const g = new THREE.Group(), key = String(id || '').replace(/^w\./, '');
    const add = (geo, color, pos, scale, o = {}) => { const m = part(geo, color, pos, scale, Object.assign({ ink: 0.01, rim: 0.25 }, o)); g.add(m); return m; };
    const stem = (y) => { add(G.cyl, '#7a5233', [0, y, 0], [0.012, 0.07, 0.012], { rot: [0, 0, 0.25] }); add(G.sphere, '#5fb257', [0.05, y + 0.02, 0], [0.05, 0.012, 0.028], { rot: [0, 0.4, 0.5] }); };
    switch (key) {
      case 'apple': add(G.sphere, '#e2574c', null, [0.13, 0.12, 0.13]); stem(0.13); break;
      case 'pear': add(lathe([[0, -0.13], [0.11, -0.11], [0.13, -0.04], [0.09, 0.04], [0.06, 0.1], [0, 0.13]], 18), '#c8d457'); stem(0.15); break;
      case 'orange': add(G.sphere, '#f39a3c', null, [0.13, 0.125, 0.13]); add(G.sphere, '#5fb257', [0.03, 0.125, 0], [0.04, 0.01, 0.025], { rot: [0, 0, 0.3] }); break;
      case 'cookie': {
        add(G.cyl, '#d9a25f', null, [0.14, 0.04, 0.14], { rot: [1.25, 0, 0] });
        [[-0.05, 0.04], [0.04, 0.06], [0.06, -0.03], [-0.03, -0.05], [0, 0.005]].forEach(([x, y]) => add(G.sphere, '#6b4026', [x, y, 0.03], [0.018, 0.018, 0.012], { ink: 0 }));
        break;
      }
      case 'bread': add(G.sphere, '#d99a4e', null, [0.2, 0.11, 0.12]); [-0.09, 0, 0.09].forEach(x => add(G.box, '#f2d29b', [x, 0.1, 0], [0.025, 0.012, 0.09], { ink: 0, rot: [0, 0, 0.4] })); break;
      case 'cheese': {
        add(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 14, 1, false, 0, 1.15), '#f5cf4b', null, null, { rot: [0, -0.6, 0] });
        [[0.06, 0.02, 0.12], [0.1, -0.03, 0.06]].forEach(p => add(G.sphere, '#d9a92e', p, [0.02, 0.02, 0.01], { ink: 0 }));
        break;
      }
      case 'honey': add(G.cyl, '#f0a830', null, [0.1, 0.16, 0.1]); add(G.cyl, '#fff3d6', [0, -0.01, 0], [0.103, 0.06, 0.103], { ink: 0 }); add(G.cyl, '#a8703f', [0, 0.1, 0], [0.108, 0.04, 0.108]); break;
      case 'cake': add(G.cyl, '#f6b6c8', null, [0.14, 0.12, 0.14]); add(G.cyl, '#fffaf0', [0, 0.07, 0], [0.146, 0.03, 0.146]); add(G.sphere, '#e2574c', [0, 0.11, 0], [0.032, 0.032, 0.032]); break;
      case 'fish': {     // a little grilled fish: silver-blue, a pale belly, a tail fin and an eye
        add(G.sphere, '#8fb0c8', null, [0.16, 0.085, 0.06]);
        add(G.sphere, '#dbe8f0', [0.01, -0.03, 0], [0.12, 0.045, 0.058], { ink: 0 });
        add(G.cone, '#7096b0', [-0.2, 0, 0], [0.075, 0.1, 0.025], { rot: [0, 0, -Math.PI / 2] });
        add(G.cone, '#7096b0', [0, 0.085, 0], [0.04, 0.06, 0.012], { rot: [0, 0, -0.5] });
        add(G.sphere, '#2b2235', [0.1, 0.025, 0.05], [0.016, 0.016, 0.01], { ink: 0 });
        [-0.05, 0.02].forEach(x => add(G.box, '#5c4a3a', [x, 0.03, 0.055], [0.012, 0.07, 0.008], { ink: 0, rot: [0, 0, 0.35] }));   // grill marks
        break;
      }
      default: add(G.sphere, '#e3c48f', null, [0.12, 0.11, 0.12]);
    }
    return g;
  }

  // ------------------------------------------------------------ an echo bat (the Quarry Caves, region 3)
  // A round fuzzy body in its color with a paler tummy, big pointy ears (pink inside), a sleepy face with two little
  // fangs, and leathery wings with scalloped edges (flat cutouts, like the moth's) that flap fast. It flies, so ground hits
  // miss it and naming the wings («golpea las alas») knocks it down, as with a moth. Asleep, it wraps itself in its wings.
  const BAT_MEMB = '#4f4866';
  const BATWING = (() => { const s = new THREE.Shape(); s.moveTo(0, 0.05); s.quadraticCurveTo(0.24, 0.24, 0.6, 0.2); s.lineTo(0.66, 0.12); s.quadraticCurveTo(0.6, 0.02, 0.52, -0.08); s.quadraticCurveTo(0.45, -0.01, 0.37, -0.1); s.quadraticCurveTo(0.29, -0.02, 0.2, -0.09); s.quadraticCurveTo(0.11, -0.02, 0, -0.05); return s; })();
  function buildBat(o) {
    const col = COLORS[o.color] || COLORS.red, fur0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      base: feltMat(fur0, { lift: col }), belly: feltMat(new THREE.Color(fur0).lerp(new THREE.Color(POM), 0.5), { rim: 0.12, warm: 0.3 }),
      wing: feltMat(BAT_MEMB, { rim: 0.08, noTex: true }), edge: feltMat(shade(fur0, -0.3), { rim: 0.08, lift: shade(col, -0.25) }), spot: feltMat(POM, { rim: 0 }),
      ear: feltMat('#e8a7bd', { rim: 0.1, warm: 0.2 }), ink: basic(INK),
    };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    body.add(P(G.sphere, M.base, [0, 0.3, 0], [0.29, 0.28, 0.26], { ink: 0.018 }));
    body.add(P(G.sphere, M.belly, [0, 0.24, 0.17], [0.17, 0.16, 0.1], { ink: 0 }));
    // tufts of fur on the head, little feet below
    for (let i = 0; i < 3; i++) body.add(P(G.ico1, M.base, [(i - 1) * 0.07, 0.56, -0.02], [0.05, 0.06, 0.05], { ink: 0.008 }));
    const feet = [-1, 1].map(s => body.add(P(G.sphere, M.edge, [s * 0.08, 0.03, 0.02], [0.05, 0.04, 0.06], { ink: 0.008 })));
    // the ears: big and pointy, pink inside (they twitch)
    const ears = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.13, 0.5, 0.0); pv.rotation.z = -s * 0.35; body.add(pv);
      pv.add(P(new THREE.ConeGeometry(0.1, 0.32, 10), M.base, [0, 0.14, 0], null, { ink: 0.012 }));
      pv.add(P(new THREE.ConeGeometry(0.055, 0.22, 8), M.ear, [0, 0.12, 0.04], null, { ink: 0 }));
      pv.userData.s = s; return pv;
    });
    // face, with two little fangs under the mouth
    const face = new THREE.Group(); face.position.set(0, 0.34, 0.245); body.add(face);
    const fc = buildFace(face, 0.85, 0.1, 1.15);
    [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.045, 6), basic('#ffffff')); f.position.set(s * 0.022, -0.115, 0.03); f.rotation.x = Math.PI; face.add(f); });
    // the wings, hinged at the shoulders; the left one mirrored
    const wings = [];
    for (const s of [1, -1]) {
      const g = new THREE.Group(); g.position.set(s * 0.2, 0.36, -0.06); g.scale.set(s * 1.2, 1.2, 1); body.add(g);
      g.add(wingCutout(BATWING, M, null));
      // the finger bones, as thin dark lines on the membrane
      for (const [x, y, a] of [[0.3, 0.06, -0.55], [0.44, 0.08, -0.25], [0.2, 0.04, -0.9]]) { const b = new THREE.Mesh(G.box, basic('#3a3550')); b.scale.set(0.012, 0.22, 0.04); b.position.set(x, y, 0); b.rotation.z = a; g.add(b); }
      wings.push({ g, s, z: 0, y: 0 });
    }
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.42, 0.2], 0.6);
    glowAt('wing', wings[0].g, [0.36, 0.06, 0], 0.55);
    const anchors = anchorSet([['head', body, [0, 0.5, 0.12]], ['wing', wings[0].g, [0.36, 0.06, 0]], ['top', body, [0, 0.72, 0]], ['mid', body, [0, 0.3, 0.12]], ['face', face, [0, 0, 0]]]);
    const scale = o.size === 'big' ? 1.25 : 0.9;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'bat', root, body, M, meshes, face, ears, wings, feet, glows, reticles, anchors, scale, big: false, color: o.color,
      parts: ['head', 'wing'], radius: 0.32 * scale, height: 0.62 * scale, labelH: 1.02, hover: 1.05 }, fc);
  }
  function poseBat(h, F, t, dt) {
    const { asleep, m } = faceTick(h, F, t);
    const down = !!F.down || F.floating === false;
    const br = Math.sin(t * 3 + F.seed) * 0.03, vy = F.vy || 0;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    h.body.rotation.z = F.tilt + Math.sin(t * 1.7 + F.seed) * 0.06 + (down ? 0.25 : 0);
    h.body.rotation.x = F.lean + (down ? -0.15 : 0) + clamp(-vy * 0.04, -0.2, 0.2);
    h.body.rotation.y = F.dazed ? Math.sin(t * 7 + F.seed) * 0.35 : 0;          // dizzy from a song: it wobbles
    const rate = asleep ? 0 : m === 'go' ? 19 : F.dazed ? 5 : F.calmed || m === 'happy' ? 15 : 12.5, ph = t * rate + F.seed * 3;
    for (const w of h.wings) {
      const f = 0.5 + 0.5 * Math.sin(ph);
      let z, y;
      if (asleep) { z = -0.95; y = 1.3; }                 // wrapped round its body
      else if (down) { z = -0.55; y = 0.2; }
      else { z = -0.38 + f * 0.95; y = 0.12 + (1 - f) * 0.35; }
      w.z = damp(w.z, z, 26, dt); w.y = damp(w.y, y, 26, dt);
      w.g.rotation.set(0, w.s * w.y, w.s * w.z);
    }
    h.ears.forEach((e, i) => { e.rotation.z = -e.userData.s * (0.35 + Math.sin(t * 2.3 + F.seed + i * 2) * 0.08 + (m === 'go' ? 0.18 : 0)); });
  }

  // ------------------------------------------------------------ a picky bee (the Bloom Gardens, region 4)
  // A round fuzzy bee in its color with two dark bands, a paler face, big eyes, antennae with pom tips, a little stinger, and
  // two pairs of see-through wings that buzz. It flies (ground hits miss it; naming the wings knocks it down, like a moth).
  // Once it has said what it likes, a bubble over its head shows it (h.setLike(icon); null hides it). The Queen Bee wears a
  // crown (o.crown). Angry, its brows come down and it buzzes faster; calmed, it hums slowly with happy eyes.
  function buildBee(o) {
    const col = COLORS[o.color] || COLORS.yellow, fur0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = {
      base: feltMat(fur0, { lift: col }), band: feltMat('#3a3046', { rim: 0.12, noTex: true, warm: 0 }), face: feltMat(new THREE.Color(fur0).lerp(new THREE.Color(POM), 0.5), { rim: 0.1, warm: 0.3 }),
      wing: new THREE.MeshToonMaterial({ color: '#eaf6ff', gradientMap: TK.grad, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
      dark: feltMat('#3a3046', { noTex: true, rim: 0 }), pom: feltMat(col, { lift: col, rim: 0.1 }), gold: feltMat('#f2c94c', { noTex: true, rim: 0.3 }), ink: basic(INK),
    };
    M.wing.userData.noFlash = true;
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // the body: a fuzzy egg lying along z (the head at +z), two dark bands round it, a stinger at the back
    body.add(P(G.sphere, M.base, [0, 0.32, -0.06], [0.26, 0.25, 0.33], { ink: 0.018 }));
    const ring = new THREE.CylinderGeometry(1, 1, 1, 20, 1, true);
    for (const [z, r] of [[-0.04, 0.262], [-0.2, 0.218]]) body.add(P(ring, M.band, [0, 0.32, z], [r, 0.075, r * 1.0], { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    body.add(P(G.cone, M.dark, [0, 0.31, -0.42], [0.05, 0.14, 0.05], { rot: [-Math.PI / 2, 0, 0], ink: 0.01 }));
    // the head, with its paler face and the face itself
    body.add(P(G.sphere, M.base, [0, 0.4, 0.24], [0.2, 0.19, 0.18], { ink: 0.016 }));
    body.add(P(G.sphere, M.face, [0, 0.37, 0.33], [0.15, 0.13, 0.07], { ink: 0 }));
    const face = new THREE.Group(); face.position.set(0, 0.4, 0.4); body.add(face);
    const fc = buildFace(face, 0.75, 0.085, 1.05);
    // antennae: thin, bending forward, with pom tips (they wiggle)
    const ants = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(s * 0.07, 0.56, 0.3); pv.rotation.set(0.5, 0, -s * 0.35); body.add(pv);
      pv.add(P(G.cyl, M.dark, [0, 0.1, 0], [0.012, 0.2, 0.012], { ink: 0 }));
      pv.add(P(G.sphere, M.pom, [0, 0.21, 0], [0.04, 0.04, 0.04], { ink: 0.008 }));
      pv.userData.s = s; return pv;
    });
    // two little legs underneath
    for (const s of [-1, 1]) body.add(P(G.cyl, M.dark, [s * 0.08, 0.09, 0.04], [0.02, 0.12, 0.02], { rot: [0.3, 0, s * 0.2], ink: 0 }));
    // the wings: a big and a small pair on the back, see-through, hinged at the body
    const wings = [];
    for (const s of [1, -1]) for (const [big, z] of [[1, 0.02], [0, -0.14]]) {
      const g = new THREE.Group(); g.position.set(s * 0.1, 0.55, z); body.add(g);
      const w = new THREE.Mesh(G.sphere, M.wing); w.scale.set(big ? 0.24 : 0.16, 0.012, big ? 0.13 : 0.09); w.position.set(s * (big ? 0.2 : 0.14), 0.02, -0.03); w.userData.noFlash = true; w.renderOrder = 2; g.add(w);
      // (a vein down the middle instead of an ink hull: a hull would show through the see-through wing as a dark disc)
      const vein = new THREE.Mesh(G.box, basic('#9aa8c4')); vein.scale.set(big ? 0.34 : 0.22, 0.006, 0.012); vein.position.set(s * (big ? 0.18 : 0.12), 0.024, -0.03); vein.userData.noFlash = true; g.add(vein);
      wings.push({ g, s, big, z: 0 });
    }
    // the Queen Bee's crown (o.crown, or h.addCrown() later: the stage builds foes from kind, color and size only)
    let crown = null;
    const addCrown = () => {
      if (crown) return crown;
      crown = new THREE.Group(); crown.position.set(0, 0.6, 0.22); body.add(crown);
      crown.add(P(new THREE.CylinderGeometry(0.1, 0.11, 0.07, 10, 1, true), M.gold, [0, 0, 0], null, { ink: 0.01 }));
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; crown.add(P(G.cone, M.gold, [Math.cos(a) * 0.09, 0.07, Math.sin(a) * 0.09], [0.025, 0.08, 0.025], { ink: 0.006 })); crown.add(P(G.sphere, M.pom, [Math.cos(a) * 0.09, 0.115, Math.sin(a) * 0.09], [0.018, 0.018, 0.018], { ink: 0 })); }
      return crown;
    };
    if (o.crown) addCrown();
    // the bubble over its head: what it likes (drawn on demand)
    const likeCv = document.createElement('canvas'); likeCv.width = likeCv.height = 128;
    const likeTex = new THREE.CanvasTexture(likeCv);
    const like = new THREE.Sprite(new THREE.SpriteMaterial({ map: likeTex, transparent: true, depthWrite: false, depthTest: false }));
    like.position.set(0, 1.0, 0.1); like.scale.setScalar(0.42); like.renderOrder = 7; like.visible = false; root.add(like);
    const setLike = icon => {
      if (!icon) { like.visible = false; return; }
      const c = likeCv.getContext('2d'); c.clearRect(0, 0, 128, 128);
      c.fillStyle = '#fffaf0'; c.strokeStyle = INK; c.lineWidth = 6;
      c.beginPath(); c.arc(64, 58, 50, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(52, 104); c.lineTo(64, 124); c.lineTo(74, 104); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fffaf0'; c.fillRect(54, 98, 18, 9);
      try { if (typeof ICONS !== 'undefined') c.drawImage(ICONS.canvas(icon, 96), 18, 12, 92, 92); } catch (e) { /* no icon: an empty bubble */ }
      likeTex.needsUpdate = true; like.visible = true;
    };
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.42, 0.3], 0.5);
    glowAt('wing', wings[0].g, [0.2, 0.02, -0.03], 0.5);
    const anchors = anchorSet([['head', body, [0, 0.45, 0.3]], ['wing', wings[0].g, [0.2, 0.02, -0.03]], ['top', body, [0, 0.74, 0.05]], ['mid', body, [0, 0.32, 0.05]], ['face', face, [0, 0, 0]], ['mouth', face, [0, -0.08, 0.02]]]);
    const scale = o.size === 'big' ? 1.25 : 0.95;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'bee', root, body, M, meshes, face, wings, ants, glows, reticles, anchors, scale, big: false, color: o.color, setLike, like, addCrown,
      parts: ['head', 'wing'], radius: 0.32 * scale, height: 0.66 * scale, labelH: 1.18, hover: 1.0 }, fc);
  }
  function poseBee(h, F, t, dt) {
    const { asleep, angry, m } = faceTick(h, F, t);
    const down = !!F.down || F.floating === false;
    const br = Math.sin(t * 3.4 + F.seed) * 0.03, vy = F.vy || 0;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    h.body.rotation.z = F.tilt + Math.sin(t * 2.1 + F.seed) * 0.08 + (down ? 0.3 : 0) + (angry ? Math.sin(t * 31) * 0.03 : 0);
    h.body.rotation.x = F.lean + (down ? -0.1 : 0.12) + clamp(-vy * 0.04, -0.2, 0.2);
    // the wings buzz: a blur of quick strokes (faster when angry or attacking, slow and dreamy when calmed or happy)
    const rate = asleep || down ? 0 : angry || m === 'go' ? 58 : F.calmed || m === 'happy' ? 18 : 40, ph = t * rate + F.seed * 3;
    for (const w of h.wings) {
      const f = asleep || down ? -0.25 : Math.sin(ph + (w.big ? 0 : 0.6)) * 0.55 + 0.25;
      w.z = rate > 30 ? f : damp(w.z, f, 30, dt);
      w.g.rotation.set(0, w.s * 0.25, w.s * w.z);
    }
    h.ants.forEach((a, i) => { a.rotation.z = -a.userData.s * (0.35 + Math.sin(t * 4.3 + F.seed + i * 2) * 0.12 + (angry ? 0.25 : 0)); a.rotation.x = 0.5 + Math.sin(t * 3.1 + i) * 0.1; });
    if (h.like && h.like.visible) h.like.position.y = 1.0 + Math.sin(t * 2.2 + F.seed) * 0.05;
  }

  // ------------------------------------------------------------ a snowball (the Frost Peaks, region 5)
  // A lumpy white ball of snow with a coal-dot face, a knitted hat and a scarf in its color (the color is the word you aim
  // with). It grows a size every round you don't hit it: flow.js sets F.growK (1, 1.32, 1.64…) and the body swells to it
  // (F.growS). A giant one (o.giant: the Ice Clock Tower's boss) is a snowman: three balls, a carrot nose, stick arms, a top hat.
  function buildSnowball(o) {
    const col = COLORS[o.color] || COLORS.red, knit0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = { snow: feltMat('#eef3f8', { rim: 0.2, warm: 0.08, noTex: true }), shade: feltMat('#dbe5ee', { rim: 0.1, warm: 0.08, noTex: true }), knit: feltMat(knit0, { lift: col }),
      knitD: feltMat(shade(knit0, -0.2), { lift: shade(col, -0.18) }), carrot: feltMat('#e0743c', { rim: 0.1, noTex: true }), stick: feltMat('#6b4a30', { rim: 0, noTex: true }), coal: basic(INK) };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    const giant = !!o.giant;
    let headY, headR, face;
    if (!giant) {
      body.add(P(G.sphere, M.snow, [0, 0.36, 0], [0.38, 0.36, 0.37], { ink: 0.02 }));
      [[0.2, 0.5, 0.12, 0.13], [-0.22, 0.28, 0.14, 0.12], [0.08, 0.16, -0.22, 0.12], [-0.12, 0.6, -0.1, 0.1]].forEach(([x, y, z, r]) => body.add(P(G.sphere, M.shade, [x, y, z], [r, r * 0.9, r], { ink: 0.01 })));
      headY = 0.36; headR = 0.37;
    } else {
      body.add(P(G.sphere, M.snow, [0, 0.34, 0], [0.4, 0.34, 0.38], { ink: 0.02 }));
      body.add(P(G.sphere, M.snow, [0, 0.8, 0], [0.3, 0.27, 0.29], { ink: 0.02 }));
      body.add(P(G.sphere, M.snow, [0, 1.16, 0], [0.22, 0.21, 0.21], { ink: 0.02 }));
      for (let i = 0; i < 3; i++) body.add(P(G.sphere, M.coal, [0, 0.7 + i * 0.12, 0.28 - i * 0.012], [0.035, 0.035, 0.02], { ink: 0 }));
      for (const s of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(s * 0.26, 0.86, 0); arm.rotation.z = s * -0.9; body.add(arm); arm.add(P(G.cyl, M.stick, [0, 0.2, 0], [0.025, 0.42, 0.025], { ink: 0.006 })); arm.add(P(G.cyl, M.stick, [s * 0.04, 0.38, 0], [0.016, 0.14, 0.016], { rot: [0, 0, s * 0.7], ink: 0 })); }
      headY = 1.16; headR = 0.21;
    }
    // the face on the front (coal eyes and mouth, from the shared face), a carrot nose on the snowman
    face = new THREE.Group(); face.position.set(0, headY + (giant ? 0.02 : 0.04), headR * 0.96); body.add(face);
    const fc = buildFace(face, giant ? 0.9 : 1.1, giant ? 0.075 : 0.12, giant ? 1.05 : 1.3);
    if (giant) face.add(P(new THREE.ConeGeometry(0.035, 0.2, 8), M.carrot, [0, -0.04, 0.1], null, { rot: [Math.PI / 2, 0, 0], ink: 0.006 }));
    // the knitted hat (a top hat on the snowman) and the scarf, in its color
    const hat = new THREE.Group(); hat.position.set(0, headY + headR * 0.82, -0.02); hat.rotation.x = -0.18; body.add(hat);
    if (!giant) {
      hat.add(P(new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI / 2), M.knit, [0, -0.05, 0], [0.24, 0.2, 0.24], { ink: 0.014 }));
      hat.add(P(new THREE.TorusGeometry(0.22, 0.045, 8, 22), M.knitD, [0, -0.04, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
      hat.add(P(G.ico1, M.snow, [0, 0.17, 0], [0.07, 0.07, 0.07], { ink: 0.008 }));
    } else {
      hat.add(P(G.cyl, M.knitD, [0, 0.0, 0], [0.24, 0.03, 0.24], { ink: 0.01 }));
      hat.add(P(G.cyl, M.knit, [0, 0.13, 0], [0.15, 0.24, 0.15], { ink: 0.012 }));
    }
    const scarfY = giant ? 0.98 : 0.18, scarfR = giant ? 0.24 : 0.33;
    const scarf = P(new THREE.TorusGeometry(scarfR, 0.05, 8, 26), M.knit, [0, scarfY, 0], [1, 1, 0.92], { rot: [Math.PI / 2 - 0.12, 0, 0], ink: 0.01 }); body.add(scarf);
    body.add(P(G.box, M.knitD, [scarfR * 0.55, scarfY - 0.12, scarfR * 0.78], [0.09, 0.24, 0.035], { rot: [0.1, 0, 0.25], ink: 0.006 }));
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, headY + 0.05, headR * 0.7], 0.6);
    const top = headY + headR + (giant ? 0.42 : 0.3);
    const anchors = anchorSet([['head', body, [0, headY + 0.08, headR * 0.6]], ['top', body, [0, top, 0]], ['mid', body, [0, giant ? 0.6 : 0.36, 0.2]], ['face', face, [0, 0, 0]], ['mouth', face, [0, -0.08, 0.04]]]);
    const scale = 1.0;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'snowball', root, body, M, meshes, face, hat, scarf, glows, reticles, anchors, scale, big: false, color: o.color, giant,
      parts: [], radius: 0.4 * scale, height: top * scale, labelH: giant ? 1.7 : 1.02, hover: 0.95 }, fc);
  }
  function poseSnowball(h, F, t, dt) {
    faceTick(h, F, t);
    F.growS = damp(F.growS || F.growK || 1, F.growK || 1, 5, dt);
    const g = F.growS, br = Math.sin(t * 2.1 + F.seed) * 0.025;
    h.body.scale.set(F.sx * g * (1 - br * 0.5), F.sy * g * (1 + br), F.sx * g * (1 - br * 0.5));
    h.body.rotation.z = F.tilt + Math.sin(t * 1.4 + F.seed) * 0.05;
    h.body.rotation.x = F.lean + (F.rolling ? Math.sin(t * 18) * 0.12 : 0);
    h.hat.rotation.z = Math.sin(t * 1.9 + F.seed) * 0.06;
  }

  // ------------------------------------------------------------ a crab (Port Brisa, region 6)
  // A wide felt shell in its color, a paler belly, a face on the front between two eye stalks, two big claws held up in
  // front and three legs a side. It scuttles from side to side and snaps its claws: shell and claws always face you, so a
  // hit from the front clangs off (flow.js: say «por detrás»). Big ones (o.size 'big') are a size up.
  function buildCrab(o) {
    const col = COLORS[o.color] || COLORS.red, shell0 = hushed(col);
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = { shell: feltMat(shell0, { lift: col }), shellD: feltMat(shade(shell0, -0.18), { lift: shade(col, -0.16) }), belly: feltMat(new THREE.Color(shell0).lerp(new THREE.Color(POM), 0.55), { rim: 0.1, warm: 0.2 }),
      pom: feltMat(POM, { rim: 0.1, noTex: true }), dark: feltMat('#3a3046', { noTex: true, rim: 0 }) };
    const meshes = [];
    const P = (geo, mat, pos, scale, opt = {}) => { const m = part(geo, null, pos, scale, Object.assign({ mat }, opt)); meshes.push(m); return m; };
    // the shell: a wide low dome, a rim round it, a belly under it
    body.add(P(G.sphere, M.shell, [0, 0.3, 0], [0.44, 0.22, 0.32], { ink: 0.02 }));
    body.add(P(new THREE.TorusGeometry(1, 0.08, 6, 24), M.shellD, [0, 0.25, 0], [0.42, 0.3, 0.42], { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    body.add(P(G.sphere, M.belly, [0, 0.2, 0], [0.38, 0.1, 0.27], { ink: 0.01 }));
    for (const [x, z] of [[-0.18, -0.08], [0.16, -0.12], [0.02, 0.06]]) body.add(P(G.sphere, M.shellD, [x, 0.47, z], [0.06, 0.03, 0.05], { ink: 0 }));
    // the face, on the front of the shell; two eye stalks with pom tips on top
    const face = new THREE.Group(); face.position.set(0, 0.32, 0.29); body.add(face);
    const fc = buildFace(face, 0.85, 0.09, 1.1);
    const stalks = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * 0.12, 0.46, 0.16); body.add(g); g.add(P(G.cyl, M.dark, [0, 0.07, 0], [0.018, 0.14, 0.018], { ink: 0 })); g.add(P(G.sphere, M.pom, [0, 0.16, 0], [0.045, 0.045, 0.045], { ink: 0.008 })); g.userData.s = s; return g; });
    // the claws: an arm up and forward, a pincer (a fat top and a thinner bottom that opens)
    const claws = [-1, 1].map(s => {
      const arm = new THREE.Group(); arm.position.set(s * 0.36, 0.3, 0.16); arm.rotation.set(-0.5, s * 0.5, 0); body.add(arm);
      arm.add(P(G.cyl, M.shellD, [0, 0.12, 0], [0.05, 0.26, 0.05], { ink: 0.008 }));
      const hand = new THREE.Group(); hand.position.set(0, 0.28, 0.02); arm.add(hand);
      hand.add(P(G.sphere, M.shell, [0, 0.06, 0.02], [0.13, 0.1, 0.16], { ink: 0.014 }));
      const jaw = new THREE.Group(); jaw.position.set(0, 0.0, 0.05); hand.add(jaw);
      jaw.add(P(G.sphere, M.shellD, [0, -0.03, 0.1], [0.07, 0.05, 0.12], { ink: 0.01 }));
      return { arm, hand, jaw, s };
    });
    // three legs a side, splayed out
    const legs = [];
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const g = new THREE.Group(); g.position.set(s * 0.32, 0.22, -0.12 + i * 0.1); g.rotation.set(0, s * (0.25 - i * 0.25), s * -0.9); body.add(g);
      g.add(P(G.cyl, M.shellD, [0, -0.13, 0], [0.025, 0.26, 0.025], { ink: 0.006 })); legs.push({ g, s, i });
    }
    const glows = {}, reticles = {}, glowAt = glowMaker(glows, reticles);
    glowAt('head', body, [0, 0.36, 0.28], 0.5);
    const anchors = anchorSet([['head', body, [0, 0.4, 0.26]], ['top', body, [0, 0.72, 0]], ['mid', body, [0, 0.3, 0.12]], ['face', face, [0, 0, 0]], ['mouth', face, [0, -0.08, 0.02]]]);
    const scale = o.size === 'big' ? 1.3 : 1.0;
    root.scale.setScalar(scale);
    return Object.assign({ kind: 'crab', root, body, M, meshes, face, stalks, claws, legs, glows, reticles, anchors, scale, big: o.size === 'big', color: o.color,
      parts: [], radius: 0.46 * scale, height: 0.72 * scale, labelH: 1.0, hover: 0.6 }, fc);
  }
  function poseCrab(h, F, t, dt) {
    const { asleep, angry, m } = faceTick(h, F, t);
    // it scuttles from side to side (faster when angry or going for you), the legs ticking, the claws snapping
    const busy = !asleep && !F.calmed, rate = angry || m === 'go' ? 9 : 4.5, sway = busy ? Math.sin(t * rate * 0.35 + F.seed) * 0.12 : 0;
    const br = Math.sin(t * 2.6 + F.seed) * 0.02;
    h.body.position.x = sway;
    h.body.scale.set(F.sx * (1 + br), F.sy * (1 - br), F.sx * (1 + br));
    h.body.rotation.z = F.tilt + (busy ? Math.cos(t * rate * 0.35 + F.seed) * 0.05 : 0);
    h.body.rotation.x = F.lean;
    for (const L of h.legs) L.g.rotation.x = busy ? Math.sin(t * rate + L.i * 2.1 + (L.s > 0 ? 1 : 0)) * 0.35 : 0;
    for (const c of h.claws) { c.jaw.rotation.x = busy ? Math.max(0, Math.sin(t * (angry ? 7 : 3) + c.s + F.seed)) * 0.6 : 0.05; c.arm.rotation.x = -0.5 + (m === 'go' ? 0.4 : Math.sin(t * 1.7 + c.s) * 0.08); }
    for (const s of h.stalks) s.rotation.z = Math.sin(t * 2.3 + s.userData.s + F.seed) * 0.15;
  }

  // ------------------------------------------------------------ expressions and idle life (called every frame)
  // F: the foe's state (mood, states, springs…); t: game time
  function faceTick(h, F, t) {
    const asleep = F.states.has('asleep'), angry = F.states.has('angry');
    let eyeMode = 'half', mouthOpen = 0;
    const m = F.face || (asleep ? 'asleep' : F.mood);
    if (m === 'asleep' || m === 'sleep') eyeMode = 'shut';
    else if (m === 'hurt' || F.down) eyeMode = 'hurt';
    else if (m === 'happy' || F.calmed) eyeMode = 'happy';
    else if (m === 'go' || m === 'alert' || angry) eyeMode = 'open';
    else if (m === 'shy') eyeMode = (t + F.seed) % 4 < 0.6 ? 'open' : 'half';
    // slow sleepy blink; a yawn now and then
    if (eyeMode === 'half' && ((t * 0.9 + F.seed) % 5.2) < 0.32) eyeMode = 'shut';
    if (eyeMode === 'open' && ((t + F.seed) % 3.4) < 0.1) eyeMode = 'shut';
    const yawnPh = (t * 0.37 + F.seed * 0.7) % 1;
    const yawning = m === 'idle' && !angry && !F.shy && !F.down && yawnPh > 0.9;
    if (yawning) { const k = Math.sin((yawnPh - 0.9) / 0.1 * Math.PI); mouthOpen = k; if (k > 0.3) eyeMode = 'shut'; }
    if (m === 'go') mouthOpen = Math.max(mouthOpen, 0.45);
    if (m === 'hurt' || F.down) mouthOpen = Math.max(mouthOpen, 0.6);
    if (F.talk > 0) mouthOpen = Math.max(mouthOpen, Math.abs(Math.sin(t * 15)) * 0.7);
    h.eyes.forEach(e => setEye(e, eyeMode));
    const k = h.mouthK || 1;
    h.mouth.scale.set((0.034 + mouthOpen * 0.03) * k, (0.02 + mouthOpen * 0.055) * k, 0.012 * k);
    h.tongue.visible = mouthOpen > 0.5;
    h.brows.forEach(b => { b.visible = angry || m === 'go'; });
    return { asleep, angry, m, yawning, yawnPh };
  }
  function glowTick(h, F, t, dt) {
    // the weak point: a halo and a turning reticle
    for (const k in h.glows) {
      const on = F.weakShown && F.weak === k && F.alive;
      const g = h.glows[k], rt = h.reticles[k];
      g.material.opacity = damp(g.material.opacity, on ? 0.7 + Math.sin(t * 6) * 0.2 : 0, 10, dt);
      g.scale.setScalar(g.userData.s * 1.05 * (1 + Math.sin(t * 6) * 0.08));
      rt.material.opacity = damp(rt.material.opacity, on ? 1 : 0, 12, dt);
      rt.material.rotation += dt * 1.4;
      rt.scale.setScalar(rt.userData.s * (1 + Math.sin(t * 5) * 0.07));
    }
  }
  function poseHushling(h, F, t, dt) {
    const { asleep, angry, m, yawning, yawnPh } = faceTick(h, F, t);
    // body: breathing, sway and the squash the battle sets (F.sx, F.sy)
    const br = asleep ? Math.sin(t * 1.4 + F.seed) * 0.045 : Math.sin(t * 2.3 + F.seed) * 0.03;
    const stretch = yawning ? Math.sin(((yawnPh - 0.9) / 0.1) * Math.PI) * 0.08 : 0;
    const sy = F.sy * (1 + br + stretch), sx = F.sx * (1 - br * 0.6 - stretch * 0.4);
    h.body.scale.set(sx, sy, sx);
    h.body.rotation.z = F.tilt + Math.sin(t * 1.3 + F.seed) * (asleep ? 0.02 : 0.045) + (F.shy && !F.calmed ? Math.sin(t * 31) * 0.012 : 0);
    h.body.rotation.x = F.lean + (asleep ? 0.12 : 0) + (F.shy && !F.calmed ? 0.1 : 0);
    // floppy hood point: springs driven by the body's vertical velocity
    const vy = F.vy || 0;
    h.tip.forEach((s, i) => {
      const sp = F.tipS[i];
      const target = s.userData.rest - (asleep ? 0.22 : 0) + Math.sin(t * 1.7 + F.seed + i * 0.8) * 0.07 + clamp(vy * 0.1, -0.5, 0.5) * (i + 1) * 0.5;
      sp.v += ((target - sp.x) * 60 - sp.v * 7) * dt; sp.x += sp.v * dt;
      s.rotation.x = sp.x;
      s.rotation.z = Math.sin(t * 1.1 + F.seed + i) * 0.08;
    });
    // tail wag (faster when awake or angry)
    const wag = asleep ? 1.2 : angry || m === 'go' ? 7 : F.calmed ? 9 : 3.2, amp = asleep ? 0.05 : F.calmed ? 0.35 : 0.18;
    h.tail.forEach((s, i) => { s.rotation.x = s.userData.rest + Math.sin(t * wag * 0.5 + F.seed + i * 0.6) * 0.08; s.rotation.z = Math.sin(t * wag + F.seed - i * 0.7) * amp * (0.5 + i * 0.25); });
    // little arms
    h.arms.forEach((a, i) => { const s = i ? 1 : -1; a.rotation.z = s * (0.55 + (F.armUp || 0) * 1.6) + Math.sin(t * 2.6 + F.seed + i) * 0.08; a.rotation.x = -(F.armUp || 0) * 0.5; });
  }
  function poseMoth(h, F, t, dt) {
    const { asleep, m } = faceTick(h, F, t);
    const down = !!F.down || F.floating === false;   // knocked down: on the ground, wings flat
    const br = Math.sin(t * 2.6 + F.seed) * 0.03, vy = F.vy || 0;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    h.body.rotation.z = F.tilt + Math.sin(t * 1.5 + F.seed) * 0.05 + (down ? 0.22 : 0);
    h.body.rotation.x = F.lean + (asleep ? 0.1 : 0) + (down ? -0.12 : 0) + clamp(-vy * 0.04, -0.2, 0.2);
    // wings: a quick flap while it hovers (faster when it attacks or rejoices), drooped when it's down or asleep
    const rate = asleep ? 2.4 : m === 'go' ? 17 : F.calmed || m === 'happy' ? 14 : 10.5;
    const ph = t * rate + F.seed * 3;
    for (const w of h.wings) {
      const f = 0.5 + 0.5 * Math.sin(ph - (w.upper ? 0 : 0.7));
      let z, y;
      if (down) { z = w.upper ? -0.42 : -0.55; y = 0.12 + Math.sin(t * 3 + F.seed) * 0.03; }
      else if (asleep) { z = w.upper ? 0.7 : 0.3; y = 0.95; }   // folded up over its back
      else { z = (w.upper ? -0.14 : -0.3) + f * (w.upper ? 0.55 : 0.4); y = 0.08 + f * 0.28; }
      w.z = damp(w.z, z, 26, dt); w.y = damp(w.y, y, 26, dt);
      w.g.rotation.set(-0.16, w.s * w.y, w.s * w.z);
    }
    h.antennae.forEach((a, i) => {
      const s = i ? 1 : -1, [rx, rz] = a.userData.rest;
      a.rotation.x = rx + Math.sin(t * 2.2 + F.seed + i) * 0.08 + clamp(vy * 0.06, -0.3, 0.3) + (down ? 0.5 : 0);
      a.rotation.z = rz + Math.sin(t * 3.1 + F.seed * 2 + i) * 0.06 * s + (m === 'go' ? -s * 0.15 : 0);
    });
    h.legs.forEach(l => { l.rotation.x = l.userData.rest + Math.sin(t * 3.4 + F.seed + l.userData.i * 1.3) * 0.18 + clamp(vy * 0.05, -0.3, 0.3); });
  }
  function poseBeetle(h, F, t, dt) {
    const { asleep, angry, m } = faceTick(h, F, t);
    const br = asleep ? Math.sin(t * 1.4 + F.seed) * 0.035 : Math.sin(t * 2.1 + F.seed) * 0.022, vy = F.vy || 0;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    h.body.rotation.z = F.tilt + Math.sin(t * 1.2 + F.seed) * 0.025;
    h.body.rotation.x = F.lean + (asleep ? 0.08 : 0);
    // the wing cases lift a crack when it's riled up
    const open = angry || m === 'go' ? 0.14 + Math.abs(Math.sin(t * 18)) * 0.05 : 0;
    h.halves.forEach(hv => { const s = hv.userData.s; hv.rotation.z = damp(hv.rotation.z, -s * (0.045 + open), 14, dt); });
    h.head.rotation.x = Math.sin(t * 1.6 + F.seed) * 0.05 + (asleep ? 0.18 : 0);
    // legs: a tripod scuttle while it walks (F.walk), splayed in the air, a little shuffle at rest
    const air = clamp(Math.abs(vy) * 0.12, 0, 1), walk = F.walk || 0;
    h.legs.forEach(l => {
      const u = l.userData, ph = walk * (u.tri ? 1 : -1);
      l.rotation.y = u.ry + Math.sin(walk) * 0.35 * (u.tri ? 1 : -1) * (walk ? 1 : 0) + Math.sin(t * 2 + u.row + F.seed) * 0.04;
      l.rotation.z = u.rz + u.s * (air * 0.5 + (walk ? Math.max(0, Math.sin(ph)) * 0.25 : 0));
    });
    h.antennae.forEach((a, i) => {
      const s = i ? 1 : -1, [rx, rz] = a.userData.rest;
      a.rotation.x = rx + Math.sin(t * 2.6 + F.seed + i * 1.7) * 0.1 + clamp(vy * 0.06, -0.3, 0.3) + (asleep ? 0.5 : 0);
      a.rotation.z = rz + Math.sin(t * 3.3 + F.seed + i) * 0.07 * s;
    });
    const wag = asleep ? 1.2 : angry || m === 'go' ? 7 : F.calmed ? 9 : 3, amp = asleep ? 0.05 : F.calmed ? 0.35 : 0.2;
    h.tail.forEach((s, i) => { s.rotation.x = s.userData.rest + Math.sin(t * wag * 0.5 + F.seed + i * 0.6) * 0.08; s.rotation.z = Math.sin(t * wag + F.seed - i * 0.7) * amp * (0.5 + i * 0.3); });
  }
  // F.curl (0 walking … 1 a ball), F.spin (how far the ball has rolled), F.rolling (while something rolls it),
  // F.flip (0 … 1 on its back), F.walk (the trot's phase)
  function poseArmadillo(h, F, t, dt) {
    const { asleep, angry, m } = faceTick(h, F, t);
    const k = clamp(F.curl || 0, 0, 1), e = k * k * (3 - 2 * k), flip = clamp(F.flip || 0, 0, 1), up = flip > 0.5;
    const br = asleep ? Math.sin(t * 1.4 + F.seed) * 0.03 : Math.sin(t * 2.2 + F.seed) * 0.018;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    // on its back: half a turn around its long axis, lifted so the shell rests on the ground, rocking
    const rock = up ? Math.sin(t * 3.4 + F.seed) * 0.13 * flip : 0;
    h.body.rotation.z = F.tilt + flip * Math.PI + rock + Math.sin(t * 1.2 + F.seed) * 0.02 * (1 - flip);
    h.body.rotation.x = F.lean;
    h.body.position.y = flip * A_FLIP_Y;
    // the ball turns as it rolls; at rest it settles upright again (face to the front)
    if (!F.rolling) F.spin = damp(F.spin || 0, Math.round((F.spin || 0) / TAU) * TAU, 6, dt);
    h.spin.rotation.x = F.spin || 0;
    // the plates swing from the walking dome to the ball
    for (const p of h.plates) { p.g.position.set(0, lerp(AY - AR, 0, e), lerp(p.zw, 0, e)); p.g.rotation.x = lerp(p.aw, p.ab, e); }
    h.under.position.set(0, lerp(AY - AR, 0, e), 0); h.under.scale.set(lerp(0.27, 0.285, e), lerp(0.165, 0.285, e), lerp(0.38, 0.285, e));
    h.belly.position.set(0, lerp(AY - AR - 0.05, 0, e), lerp(0.01, 0, e)); h.belly.scale.set(lerp(0.22, 0.25, e), lerp(0.12, 0.25, e), lerp(0.31, 0.25, e));
    // the head sniffs about, or tucks in under the front shield; on its back it wriggles
    const W = A_HEAD.walk, Bp = A_HEAD.ball;
    const sniff = (1 - e) * (m === 'idle' && !asleep && !up ? Math.sin(t * 5.5 + F.seed) * 0.05 : 0);
    h.head.position.set(0, lerp(W[0], Bp[0], e), lerp(W[1], Bp[1], e));
    h.head.rotation.x = lerp(W[2] + sniff, Bp[2], e) + (up ? Math.sin(t * 7 + F.seed) * 0.12 : 0);
    h.head.rotation.y = (1 - e) * (up ? Math.sin(t * 5 + F.seed) * 0.25 : Math.sin(t * 0.7 + F.seed) * 0.12);
    h.ears.forEach(ear => { const s = ear.userData.s; ear.rotation.z = ear.userData.rest - s * (e * 0.5 + (angry || m === 'go' ? 0.15 : 0)) + Math.sin(t * 2.3 + F.seed + s) * 0.05; });
    // the tail: wagging behind it, or wrapped around the ball
    const TW = A_TAIL.walk, TB = A_TAIL.ball;
    const wag = angry || m === 'go' ? 7 : F.calmed ? 9 : 3;
    h.tail.forEach((s, i) => {
      if (!i) s.position.set(0, lerp(TW[0], TB[0], e), lerp(TW[1], TB[1], e));
      s.rotation.x = i ? lerp(TW[3], TB[3], e) : lerp(TW[2], TB[2], e);
      s.rotation.y = (1 - e) * Math.sin(t * wag + F.seed - i * 0.7) * (up ? 0.35 : 0.14);
    });
    // legs: a trot, folded away in the ball, kicking in the air on its back
    const walk = F.walk || 0;
    h.legs.forEach((l, i) => {
      const u = l.userData;
      const sw = walk ? Math.sin(walk + (u.diag ? Math.PI : 0)) * 0.6 : 0;
      l.rotation.x = sw + (up ? Math.sin(t * 13 + i * 1.7) * 0.7 : 0);
      l.rotation.z = up ? Math.sin(t * 11 + i) * 0.25 : 0;
      l.position.set(u.x * (1 - e * 0.5), lerp(u.y, AR, e), u.z * (1 - e));
      l.scale.setScalar(Math.max(0.001, 1 - e * 1.15));
    });
    // flailing on its back: squeezed-shut eyes and an open mouth
    if (up) { h.eyes.forEach(x => setEye(x, 'hurt')); const mk = h.mouthK || 1; h.mouth.scale.set(0.05 * mk, 0.05 * mk, 0.012 * mk); h.tongue.visible = true; }
  }
  // F.leap (0…1; otherwise its vertical speed kicks the legs out), F.croak (seconds of croaking left), F.puff (0…1 more
  // throat), F.lash / F.lashYaw / F.lashPitch (the tongue)
  function poseFrog(h, F, t, dt) {
    const { asleep, m } = faceTick(h, F, t);
    const br = asleep ? Math.sin(t * 1.3 + F.seed) * 0.035 : Math.sin(t * 2.2 + F.seed) * 0.022;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    h.body.rotation.z = F.tilt + Math.sin(t * 1.1 + F.seed) * 0.02;
    h.body.rotation.x = F.lean + (asleep ? 0.1 : 0);
    // the legs: folded at rest, kicked out down and back in the air
    const leap = clamp(Math.max(F.leap || 0, Math.abs(F.vy || 0) * 0.3 - 0.15), 0, 1);
    F.leapS = damp(F.leapS || 0, leap, 16, dt);
    h.legs.forEach((l, i) => { l.rotation.x = F.leapS * 1.2; l.rotation.z = (i ? 1 : -1) * F.leapS * 0.15; });
    h.arms.forEach(a => { a.rotation.x = -F.leapS * 0.75 + Math.sin(t * 2 + F.seed) * 0.02; });
    // the throat: a flutter all the time, a ribbit now and then, a big balloon when it croaks, talks or winds up
    if (F.croak > 0) F.croak = Math.max(0, F.croak - dt);
    let puff = asleep ? 0.04 * Math.max(0, Math.sin(t * 2.5 + F.seed)) : 0.07 * Math.max(0, Math.sin(t * 9 + F.seed));
    const rib = (t * 0.21 + F.seed * 0.37) % 1;
    if (!asleep && rib > 0.9) puff = Math.max(puff, Math.pow(Math.sin(((rib - 0.9) / 0.1) * Math.PI * 2), 2) * 0.75);
    if (F.croak > 0) puff = Math.max(puff, 0.55 + 0.45 * Math.abs(Math.sin(t * 8)));
    if (F.talk > 0) puff = Math.max(puff, Math.abs(Math.sin(t * 11)) * 0.8);
    if (m === 'go' && !(F.lash > 0)) puff = Math.max(puff, 0.45 + Math.sin(t * 13) * 0.12);
    puff = Math.max(puff, F.puff || 0);
    F.puffS = damp(F.puffS || 0, puff, 20, dt);
    h.throat.scale.set(0.16 * (1 + F.puffS * 0.95), 0.11 * (1 + F.puffS * 0.8), 0.13 * (1 + F.puffS * 0.6));
    h.throat.position.set(0, -0.13 - F.puffS * 0.02, 0.16 + F.puffS * 0.05);
    // the head looks about a little
    h.head.rotation.y = Math.sin(t * 0.6 + F.seed) * (asleep ? 0.02 : 0.1);
    h.head.rotation.x = asleep ? 0.12 : Math.sin(t * 0.9 + F.seed) * 0.04;
    // the tongue, and the mouth wide open behind it
    const L = Math.max(0, F.lash || 0);
    h.lash.visible = L > 0.02;
    if (h.lash.visible) {
      h.lash.rotation.set(-(F.lashPitch || 0), F.lashYaw || 0, 0);
      h.lashTongue.scale.set(1, 1, L); h.lashTip.position.set(0, 0, L);
      h.mouth.scale.set(0.075, 0.07, 0.012);
    }
  }
  // the dummy: springs on its post (F.wobX / F.wobZ, kicked through F.wobVX / F.wobVZ), a spin that runs down (F.spinV),
  // arms up for a high swing or down for a low one (F.swing)
  function poseDummy(h, F, t, dt) {
    faceTick(h, F, t);
    F.wobX = F.wobX || 0; F.wobZ = F.wobZ || 0; F.wobVX = F.wobVX || 0; F.wobVZ = F.wobVZ || 0;
    F.wobVX += (-F.wobX * 70 - F.wobVX * 3.5) * dt; F.wobX += F.wobVX * dt;
    F.wobVZ += (-F.wobZ * 70 - F.wobVZ * 3.5) * dt; F.wobZ += F.wobVZ * dt;
    F.spinV = (F.spinV || 0) * Math.exp(-2.4 * dt); F.spinA = (F.spinA || 0) + F.spinV * dt;
    if (Math.abs(F.spinV) < 0.6) F.spinA = damp(F.spinA, Math.round(F.spinA / TAU) * TAU, 5, dt);   // it settles facing front
    h.body.rotation.set(F.wobX + F.lean * 0.5, F.spinA, F.wobZ + F.tilt + Math.sin(t * 1.1 + F.seed) * 0.012);
    h.body.scale.set(F.sx, F.sy, F.sx);
    F.swingS = damp(F.swingS || 0, clamp(F.swing || 0, -1, 1), 8, dt);
    h.arms.forEach((a, i) => { const s = i ? 1 : -1; a.rotation.z = s * (F.swingS * 0.95 - 0.08 + Math.sin(t * 1.4 + F.seed + i) * 0.03); });
    h.scarf.rotation.y = Math.sin(t * 1.2 + F.seed) * 0.08 - F.spinV * 0.02;
  }
  function poseKernel(h, F, t, dt) {
    const { asleep, m } = faceTick(h, F, t);
    const br = asleep ? Math.sin(t * 1.4 + F.seed) * 0.03 : Math.sin(t * 2.6 + F.seed) * 0.02;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br), F.sx * (1 - br * 0.5));
    h.body.rotation.set(F.lean, 0, F.tilt + Math.sin(t * 1.5 + F.seed) * 0.03);
    // a little march in place, faster when it's riled up; its spear bobs along
    const step = Math.sin(t * (m === 'go' ? 9 : 2.6) + F.seed);
    h.feet.forEach((f, i) => { f.rotation.x = (i ? 1 : -1) * step * (m === 'go' ? 0.35 : 0.08); });
    h.spear.rotation.x = -0.25 + step * 0.05; h.arms[0].rotation.z = -0.5 - step * 0.08;
  }
  function posePopcorn(h, F, t, dt) {
    const { asleep } = faceTick(h, F, t);
    const br = asleep ? 0.02 : 0.045;
    const bob = Math.abs(Math.sin(t * 3.2 + F.seed));
    h.body.scale.set(F.sx * (1 + bob * br), F.sy * (1 - bob * br * 1.4 + 0.02), F.sx * (1 + bob * br));
    h.body.rotation.set(F.lean, Math.sin(t * 0.9 + F.seed) * 0.12, F.tilt + Math.sin(t * 2.1 + F.seed) * 0.06);
    h.feet.forEach((f, i) => { f.rotation.x = Math.sin(t * 6 + F.seed + i * Math.PI) * 0.12; });
  }
  // F.cape (0 closed … 1 open, eased here), F.surrender (0 … 1)
  function poseColonel(h, F, t, dt) {
    const { m } = faceTick(h, F, t);
    const give = clamp(F.surrender || 0, 0, 1);
    h.brows.forEach(b => { b.visible = give < 0.5 && m !== 'happy'; });             // fierce, until he gives up
    const br = Math.sin(t * 1.8 + F.seed) * 0.018;
    h.body.scale.set(F.sx * (1 - br * 0.5), F.sy * (1 + br) * (1 - give * 0.12), F.sx * (1 - br * 0.5));
    h.body.rotation.set(F.lean + give * 0.2, Math.sin(t * 0.5 + F.seed) * 0.05, F.tilt + Math.sin(t * 1.2 + F.seed) * 0.02);
    F.capeS = damp(F.capeS || 0, clamp(F.cape || 0, 0, 1), 9, dt);
    const flap = F.capeS > 0.5 ? 0.06 : 0.015;
    // opening: the two front leaves slide round the shoulder ring to his sides (like a cloak thrown open) and flare a
    // little; the others flare out behind him like a peeled ear of corn
    h.cape.forEach((g, i) => {
      const a0 = g.userData.a, front = Math.cos(a0) > 0.3, a = a0 + (front ? Math.sign(Math.sin(a0)) * F.capeS * 0.95 : 0);
      g.position.set(Math.sin(a) * 0.36, 0.71, Math.cos(a) * 0.36); g.rotation.y = a;
      g.rotation.x = -F.capeS * (front ? 0.5 : 1.0 + Math.sin(i * 1.7) * 0.12) - Math.sin(t * 2.3 + i * 1.3 + F.seed) * flap;
    });
    const armOut = Math.max(F.capeS, give);
    h.arms.forEach((a, i) => { const s = i ? 1 : -1; a.visible = armOut > 0.15; a.rotation.z = s * (0.4 + armOut * 0.7 + (m === 'go' ? Math.sin(t * 9 + i) * 0.25 : 0)); });
    h.stache.forEach((g, i) => { g.rotation.z = (i ? -1 : 1) * (Math.sin(t * 2.2 + F.seed) * 0.05 + (F.talk > 0 ? Math.sin(t * 16) * 0.08 : 0)); });
    h.cap.rotation.z = -0.14 + give * 0.4;
    h.flag.visible = give > 0.1;
    if (h.flag.visible) { h.arms[1].rotation.z = 2.7 * give; h.cloth.rotation.y = Math.sin(t * 7) * 0.4; }
  }
  function pose(h, F, t, dt) {
    if (h.kind === 'moth') poseMoth(h, F, t, dt);
    else if (h.kind === 'beetle') poseBeetle(h, F, t, dt);
    else if (h.kind === 'armadillo') poseArmadillo(h, F, t, dt);
    else if (h.kind === 'frog') poseFrog(h, F, t, dt);
    else if (h.kind === 'dummy') poseDummy(h, F, t, dt);
    else if (h.kind === 'kernel') poseKernel(h, F, t, dt);
    else if (h.kind === 'popcorn') posePopcorn(h, F, t, dt);
    else if (h.kind === 'colonel') poseColonel(h, F, t, dt);
    else if (h.kind === 'bat') poseBat(h, F, t, dt);
    else if (h.kind === 'bee') poseBee(h, F, t, dt);
    else if (h.kind === 'snowball') poseSnowball(h, F, t, dt);
    else if (h.kind === 'crab') poseCrab(h, F, t, dt);
    else poseHushling(h, F, t, dt);
    glowTick(h, F, t, dt);
  }

  // The Hush lifting: gray felt warms toward peach, colored felt brightens to its full color (k: 0..1)
  function brighten(h, k) {
    for (const key in h.M) { const m = h.M[key], u = m.userData; if (u && u.base && u.lift) m.color.copy(u.base).lerp(u.lift, k); }
  }

  _.M = { build, pose, brighten, feltMat, COLORS, BASE, zTex, noteTex, INK, kindOf, food: buildFood, AR };

  // ------------------------------------------------------------ for the overworld: a Hush creature without a fight
  // const g = BATTLE.buildFoe('moth', 'red', { size: 'small' });   // 'hushling' | 'moth' | 'beetle' | 'armadillo' | 'frog' | 'hushling_big'
  // scene.add(g); each frame: g.userData.animate(dt, t, speed)  (speed > 0.1 makes it hop / fly / scuttle / trot / leap along)
  // g.userData.mood = 'idle' | 'alert' (eyes open, it spotted you) | 'asleep' | 'happy'
  // An armadillo trots on its legs; alert and moving (chasing you) it curls up and rolls, and asleep it's
  // a ball. g.userData.curl = a number 0..1 forces its curl (null: from the mood). A frog leaps along, legs
  // kicking out; sitting still its throat puffs, and alert it puffs it right up.
  // The group's origin is at the feet (a moth hovers about one unit above it) and it faces +z;
  // turn it with g.rotation.y. g.userData.hush = { kind, color, size, model, state }.
  const NO_STATES = new Set(), ASLEEP = new Set(['asleep']);
  B.buildFoe = function (kind = 'hushling', color = 'red', o = {}) {
    const k = kindOf(kind);
    const h = build({ kind: k, color: COLORS[color] ? color : 'red', size: o.size === 'big' ? 'big' : 'small', giant: o.giant });     // (giant: the Ice Clock Tower's snowman)
    const g = new THREE.Group(); g.add(h.root);
    const spring = x => ({ x, v: 0 });
    const F = { states: NO_STATES, mood: 'idle', face: null, sx: 1, sy: 1, tilt: 0, lean: 0, seed: Math.random() * 10, vy: 0, talk: 0, armUp: 0,
      alive: true, calmed: false, shy: false, weakShown: false, weak: null, floating: k === 'moth' || k === 'bat' || k === 'bee', down: 0, walk: 0, tipS: [spring(-0.32), spring(-0.42), spring(-0.5)],
      curl: o.curl !== undefined ? o.curl : 0, flip: 0, spin: 0, rolling: false };
    g.userData.curl = o.curl !== undefined ? o.curl : null;
    let hopPh = 0, lastY = 0;
    g.userData.mood = o.mood || 'idle';
    g.userData.hush = { kind: k, color, size: o.size || 'small', model: h, state: F };
    g.userData.animate = (dt, t, speed = 0) => {
      const m = g.userData.mood;
      F.states = m === 'asleep' ? ASLEEP : NO_STATES;
      F.mood = m === 'alert' ? 'go' : m === 'happy' ? 'happy' : 'idle';
      F.calmed = m === 'happy';
      const moving = speed > 0.1;
      let y;
      if (k === 'moth' || k === 'bat' || k === 'bee') {
        // it hovers, bobbing; moving, it leans into the flight and bobs faster (an echo bat the same)
        hopPh += dt * (moving ? 5 + Math.min(speed, 4) : 2.4);
        y = (h.hover + Math.sin(hopPh + F.seed) * 0.1) * h.scale;
        F.lean = moving ? 0.22 : 0;
        F.sx = F.sy = 1;
      } else if (k === 'beetle') {
        // it scuttles on six legs, with a little bounce in its step
        hopPh = moving ? hopPh + dt * (10 + Math.min(speed, 4) * 2.5) : 0;
        F.walk = moving ? hopPh : 0;
        y = moving ? Math.abs(Math.sin(hopPh)) * 0.025 * h.scale : 0;
        F.lean = moving ? 0.06 : 0;
        F.sx = F.sy = 1;
      } else if (k === 'frog') {
        // it leaps along, legs kicking out in the air and a squash as it lands; sitting, its throat puffs
        hopPh = moving ? hopPh + dt * (4.6 + Math.min(speed, 4) * 0.9) : 0;
        const hop = moving ? Math.abs(Math.sin(hopPh)) : 0;
        y = hop * 0.3 * h.scale;
        F.leap = moving && hop > 0.18 ? 1 : 0;
        const land = moving ? Math.max(0, 1 - hop * 5) : 0;
        F.sy = 1 + (hop > 0.25 ? 0.1 * hop : -0.22 * land); F.sx = 1 - (F.sy - 1) * 0.6;
        F.lean = moving ? -0.22 * Math.cos(hopPh % Math.PI) : 0;      // nose up as it takes off, down as it lands
      } else if (k === 'armadillo') {
        // it trots on its stubby legs; after you (alert and moving) it rolls up and rolls; asleep, it's a ball
        const want = typeof g.userData.curl === 'number' ? clamp(g.userData.curl, 0, 1) : m === 'asleep' || (m === 'alert' && moving) ? 1 : 0;
        F.curl = damp(F.curl, want, 7, dt);
        if (moving && F.curl > 0.55) {
          F.rolling = true; F.walk = 0; hopPh = 0;
          F.spin += dt * Math.min(speed, 6) / (AR * h.scale);
          y = Math.abs(Math.sin(F.spin * 2)) * 0.012 * h.scale;
        } else {
          F.rolling = false;
          hopPh = moving ? hopPh + dt * (9 + Math.min(speed, 4) * 2) : 0;
          F.walk = moving ? hopPh : 0;
          y = moving ? Math.abs(Math.sin(hopPh)) * 0.022 * h.scale : 0;
        }
        F.lean = 0; F.sx = F.sy = 1;
      } else {
        // hopping along: a bounce with squash on landing, stretch in the air
        hopPh = moving ? hopPh + dt * (6 + Math.min(speed, 4) * 1.2) : 0;
        const hop = moving ? Math.abs(Math.sin(hopPh)) : 0;
        y = hop * 0.16 * h.scale;
        const land = moving ? Math.max(0, 1 - hop * 4) : 0;
        F.sy = 1 + (hop > 0.25 ? 0.08 * hop : -0.18 * land); F.sx = 1 - (F.sy - 1) * 0.6;
        F.lean = moving ? 0.12 : 0;
      }
      F.vy = dt > 0 ? damp(F.vy, (y - lastY) / dt, 18, dt) : 0; lastY = y;
      h.root.position.y = y;
      pose(h, F, t, Math.max(dt, 1e-4));
    };
    g.userData.animate(0, 0);
    return g;
  };
})();
