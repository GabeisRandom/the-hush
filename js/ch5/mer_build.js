'use strict';
// Chapter 5, «Meridiana» (CH5-W1): the districts' 3D, in the game's drawing rule (TK's cel ramp, #2b2235 ink). Each district is a pad at
// y 600 (mer_city.js): merged, vertex-colored pieces (one solid mesh and one ink hull per pad, plus its signs), a skyline of towers, hills
// and sea in the haze around it, and the walls between the camera and you dissolving (the towns' dither, town.js patch()).
//   MERB.build(id, P) → { root, solids, ground(lx, lz), map(ctx, K), spots, anim(dt, t), signs, tram? }   (lx, lz: the pad's own coordinates)
//   MERB.U         the dither's uniforms (mer_city.js sets uFocus to you every frame)
//   MERB.tram()    the tram (two cars), MERB.sign(text, o), MERB.Batch()
const MERB = (() => {
  if (typeof THREE === 'undefined' || typeof TK === 'undefined') return null;
  const INK = '#2b2235', G = TK.G, M4 = TK.M4, TAU2 = Math.PI * 2;
  const U = { uFocus: { value: new THREE.Vector3(0, -1e4, 0) }, uFade: { value: 1 } };
  // ------------------------------------------------------------ materials: the toon look and the dither (walls between you and the camera melt)
  function patch(fade) {
    return sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nvarying vec3 vWP;\n' + sh.fragmentShader;
      if (fade) fs = fs.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
          vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
          vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
          float occl = step(0.0, along) * step(along, segL - 0.9) * (1.0 - smoothstep(1.3, 2.7, axis)) * smoothstep(0.4, 1.2, vWP.y - uFocus.y + 1.5);
          float nearCam = 1.0 - smoothstep(1.5, 3.4, length(rel));
          if (uFade > 0.5 && nearCam > 0.8) discard;
          float fadeAmt = uFade * max(occl * 0.9, nearCam);
          if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`);
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function vcMat(fade = true, o = {}) {
    const k = 'vc' + fade + JSON.stringify(o); if (MATS[k]) return MATS[k];
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color(o.emissive || '#000000'), side: o.side || THREE.FrontSide, transparent: !!o.opacity, opacity: o.opacity || 1 });
    m.onBeforeCompile = patch(fade); m.customProgramCacheKey = () => 'mer' + k;
    return (MATS[k] = m);
  }
  function inkMat(fade = true) {
    const k = 'ink' + fade; if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
    m.onBeforeCompile = patch(fade); m.customProgramCacheKey = () => 'mer' + k;
    return (MATS[k] = m);
  }
  const CYL = new THREE.CylinderGeometry(1, 1, 1, 12), CYL6 = new THREE.CylinderGeometry(1, 1, 1, 6), CONE = new THREE.ConeGeometry(1, 1, 8), BALL = new THREE.SphereGeometry(1, 10, 7);
  const PRISM = (() => { let g = new THREE.CylinderGeometry(1, 1, 1, 3); g.rotateZ(-Math.PI / 2); g.rotateX(-Math.PI / 2); g.scale(1, 1 / 1.5, 1 / Math.sqrt(3)); g = g.toNonIndexed(); g.computeVertexNormals(); return g; })();
  // ------------------------------------------------------------ a batch: pieces merged into one solid mesh and one ink hull
  function Batch() {
    const solid = [], hull = [];
    const add = (geo, m, c, hm) => { solid.push({ geo, m, color: c }); if (hm) hull.push({ geo, m: hm, color: INK }); };
    const api = {
      box(x, y, z, w, h, d, c, o = {}) { const k = o.ink === undefined ? 0.04 : o.ink, r = [o.ry || 0, o.rx || 0, o.rz || 0]; add(G.box, M4(x, y, z, w, h, d, ...r), c, k ? M4(x, y, z, w + 2 * k, h + 2 * k, d + 2 * k, ...r) : null); return api; },
      cyl(x, y, z, r, h, c, o = {}) { const k = o.ink === undefined ? 0.03 : o.ink, g = o.six ? CYL6 : CYL, rr = [o.ry || 0, o.rx || 0, o.rz || 0]; add(g, M4(x, y, z, r, h, r, ...rr), c, k ? M4(x, y, z, r + k, h + 2 * k, r + k, ...rr) : null); return api; },
      cone(x, y, z, r, h, c, o = {}) { const k = o.ink === undefined ? 0.03 : o.ink, rr = [o.ry || 0, o.rx || 0, o.rz || 0]; add(CONE, M4(x, y, z, r, h, r, ...rr), c, k ? M4(x, y, z, r + k, h + 2 * k, r + k, ...rr) : null); return api; },
      ball(x, y, z, sx, sy, sz, c, o = {}) { const k = o.ink === undefined ? 0.03 : o.ink; add(BALL, M4(x, y, z, sx, sy, sz, o.ry || 0), c, k ? M4(x, y, z, sx + k, sy + k, sz + k, o.ry || 0) : null); return api; },
      roof(x, y, z, w, h, d, c, o = {}) { const k = o.ink === undefined ? 0.05 : o.ink; add(PRISM, M4(x, y + h / 3, z, w, h, d, o.ry || 0), c, k ? M4(x, y + h / 3, z, w + 2 * k, h + 2 * k, d + 2 * k, o.ry || 0) : null); return api; },
      get n() { return solid.length; },
      build(parent, o = {}) {
        const out = [];
        if (solid.length) { const m = new THREE.Mesh(TK.merge(solid), o.mat || vcMat(o.fade !== false)); m.castShadow = o.shadow !== false; m.receiveShadow = true; parent.add(m); out.push(m); }
        if (hull.length && o.hull !== false) { const h = new THREE.Mesh(TK.merge(hull), inkMat(o.fade !== false)); h.castShadow = false; parent.add(h); out.push(h); }
        return out;
      },
    };
    return api;
  }
  // ------------------------------------------------------------ a sign: a board with text on it (the language's; canvas)
  const SIGNTEX = {};
  function signTex(text, o = {}) {
    const k = text + '|' + JSON.stringify(o); if (SIGNTEX[k]) return SIGNTEX[k];
    const W = o.px || 512, H = Math.round(W * (o.h || 0.5) / (o.w || 2));
    const tex = TK.canvasTex(W, H, (c, w, h) => {
      c.fillStyle = o.bg || '#f6efe0'; c.fillRect(0, 0, w, h);
      c.strokeStyle = o.edge || INK; c.lineWidth = Math.max(4, h * 0.06); c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
      c.fillStyle = o.fg || INK; c.textAlign = 'center'; c.textBaseline = 'middle';
      const lines = String(text).split('\n'); let fs = Math.round(h * (lines.length > 1 ? 0.3 : 0.5));
      const font = s => `${o.weight || 800} ${s}px ${o.font || 'Bahnschrift, "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif'}`;
      c.font = font(fs); while (fs > 10 && Math.max(...lines.map(l => c.measureText(l).width)) > w * 0.9) { fs -= 2; c.font = font(fs); }
      lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.15));
    });
    tex.anisotropy = 4;
    return (SIGNTEX[k] = tex);
  }
  function sign(text, w, h, o = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTex(text, Object.assign({ w, h }, o)), side: o.double ? THREE.DoubleSide : THREE.FrontSide, fog: true }));
    return m;
  }
  // ------------------------------------------------------------ a building: walls, floors, windows on the faces you see, a cornice or a roof, a shop front
  // b: { x, z, w, d, fl (floors), wall, trim, roof ('flat' | 'tile'), face: 'e' | 'w' | 'n' | 's' (the street side), shop: { awn, door } }
  const WIN = '#4f6d8f', WIN_D = '#3d566f', FRAME = '#f4eee2';
  function building(Bt, b) {
    const FH = 3, H = b.fl * FH, y0 = 0, wall = b.wall, trim = b.trim || '#f2e9d8';
    Bt.box(b.x, y0 + H / 2, b.z, b.w, H, b.d, wall, { ink: 0.05 });
    // floor bands and the cornice
    for (let f = 1; f < b.fl; f++) Bt.box(b.x, y0 + f * FH, b.z, b.w + 0.12, 0.16, b.d + 0.12, trim, { ink: 0 });
    Bt.box(b.x, y0 + H + 0.18, b.z, b.w + 0.4, 0.36, b.d + 0.4, trim, { ink: 0.04 });
    if (b.roof === 'tile') Bt.roof(b.x, y0 + H + 0.36, b.z, b.w + 0.6, 2.2, b.d + 0.6, b.roofC || '#c9643f', { ry: b.w > b.d ? 0 : Math.PI / 2 });
    else { Bt.box(b.x + b.w * 0.2, y0 + H + 0.9, b.z - b.d * 0.15, 1.2, 1.1, 1.2, '#b8aa96', { ink: 0.03 }); if (b.tank) Bt.cyl(b.x - b.w * 0.25, y0 + H + 1.2, b.z + b.d * 0.1, 0.6, 1.4, '#d8d0c0'); }
    // windows: on every face, the ground floor of the street face kept for the shop
    const faces = [['e', 1, 0], ['w', -1, 0], ['n', 0, -1], ['s', 0, 1]];
    for (const [f, sx, sz] of faces) {
      const along = sx ? b.d : b.w, n = Math.max(1, Math.floor((along - 1) / 2.4));
      for (let fl = 0; fl < b.fl; fl++) {
        if (fl === 0 && b.shop && f === b.face) continue;
        if (fl === 0 && b.door && f === b.face) continue;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n - 0.5, px = b.x + (sx ? sx * (b.w / 2 + 0.02) : t * along), pz = b.z + (sz ? sz * (b.d / 2 + 0.02) : t * along), py = y0 + fl * FH + 1.7;
          const ww = sx ? 0.12 : 1.1, dd = sx ? 1.1 : 0.12;
          Bt.box(px, py, pz, ww + (sx ? 0 : 0.24), 1.62, dd + (sx ? 0.24 : 0), FRAME, { ink: 0 });
          Bt.box(px + sx * 0.03, py, pz + sz * 0.03, ww, 1.4, dd, (i + fl) % 3 ? WIN : WIN_D, { ink: 0 });
          if (b.sills !== false) Bt.box(px + sx * 0.12, py - 0.82, pz + sz * 0.12, sx ? 0.3 : 1.3, 0.1, sx ? 1.3 : 0.3, trim, { ink: 0 });
          if (b.shutters && fl > 0) for (const s of [-1, 1]) Bt.box(px + (sx ? sx * 0.06 : s * 0.75), py, pz + (sz ? sz * 0.06 : s * 0.75), sx ? 0.06 : 0.38, 1.4, sx ? 0.38 : 0.06, b.shutters, { ink: 0 });
          if (b.balcony && fl > 0 && i % 2 === 0) { Bt.box(px + sx * 0.5, py - 0.85, pz + sz * 0.5, sx ? 0.9 : 1.6, 0.1, sx ? 1.6 : 0.9, trim, { ink: 0.02 }); Bt.box(px + sx * 0.92, py - 0.45, pz + sz * 0.92, sx ? 0.06 : 1.6, 0.7, sx ? 1.6 : 0.06, '#3a3440', { ink: 0 }); }
        }
      }
    }
    // the street face's ground floor: a shop window, a door, an awning
    const F = faces.find(x => x[0] === b.face);
    if (F && (b.shop || b.door)) {
      const [, sx, sz] = F, cx = b.x + sx * (b.w / 2 + 0.04), cz = b.z + sz * (b.d / 2 + 0.04), along = sx ? b.d : b.w;
      const dOff = b.doorAt != null ? b.doorAt : 0;
      const dx = sx ? cx : b.x + dOff, dz = sz ? cz : b.z + dOff;
      Bt.box(dx, 1.1, dz, sx ? 0.14 : 1.3, 2.2, sx ? 1.3 : 0.14, b.doorC || '#7a4b2c', { ink: 0.02 });
      Bt.box(dx + sx * 0.05, 1.1, dz + sz * 0.05, sx ? 0.06 : 0.12, 0.12, sx ? 0.12 : 0.06, '#e8c34a', { ink: 0 });
      if (b.shop) {
        const sw = Math.min(along - 3, 5.2), so = dOff > 0 ? -2.2 : 2.2;
        Bt.box(sx ? cx : b.x + so, 1.3, sz ? cz : b.z + so, sx ? 0.12 : sw, 1.9, sx ? sw : 0.12, '#a9d4e4', { ink: 0.02 });
        const ax = cx + sx * 0.8, az = cz + sz * 0.8;
        Bt.box(sx ? ax : b.x, 2.75, sz ? az : b.z, sx ? 1.7 : along - 0.4, 0.12, sx ? along - 0.4 : 1.7, b.shop.awn || '#c9443a', { ink: 0.03, rx: sz * 0.28, rz: -sx * 0.28 });
        for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6 - 0.5; Bt.box(sx ? ax + sx * 0.82 : b.x + t * (along - 0.6), 2.48, sz ? az + sz * 0.82 : b.z + t * (along - 0.6), sx ? 0.06 : 0.3, 0.3, sx ? 0.3 : 0.06, i % 2 ? '#fdf6ea' : b.shop.awn || '#c9443a', { ink: 0 }); }
      }
    }
    return { x: b.x, z: b.z, hw: b.w / 2 + 0.1, hd: b.d / 2 + 0.1, H };
  }
  // ------------------------------------------------------------ the skyline: towers, hills, the sea, in the haze around a pad (instanced, one draw call each)
  function skyline(root, o) {
    const R = rng(o.seed || 7), list = [], COLS = o.cols || ['#e9d7c2', '#d9c6b0', '#c9d2dc', '#e4cdb4', '#cfc3b8', '#dfe2e6', '#e8c9b0'];
    for (let i = 0; i < (o.n || 90); i++) {
      const a = (o.a0 !== undefined ? o.a0 + R() * o.arc : R() * TAU2), r = (o.r0 || 95) + R() * (o.r1 || 190), h = 8 + Math.pow(R(), 2.2) * (o.hmax || 46);
      list.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, w: 6 + R() * 10, d: 6 + R() * 10, h, c: COLS[(R() * COLS.length) | 0], ry: R() * 0.6 });
    }
    const im = new THREE.InstancedMesh(G.box, new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad }), list.length), col = new THREE.Color();
    list.forEach((b, i) => { im.setMatrixAt(i, M4(b.x, b.h / 2 - 1, b.z, b.w, b.h, b.d, b.ry)); im.setColorAt(i, col.set(b.c)); });
    im.frustumCulled = false; root.add(im);
    return im;
  }
  function hills(root, o) {
    const R = rng(o.seed || 11), list = [];
    for (let i = 0; i < (o.n || 14); i++) { const a = o.a0 + R() * o.arc, r = (o.r || 230) + R() * 60; list.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, s: 40 + R() * 50, h: 18 + R() * 30, c: ['#8fb27a', '#9cbb83', '#86a874'][i % 3] }); }
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 8, 0, TAU2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad }), list.length), col = new THREE.Color();
    list.forEach((b, i) => { im.setMatrixAt(i, M4(b.x, -2, b.z, b.s, b.h, b.s * 0.8)); im.setColorAt(i, col.set(b.c)); });
    im.frustumCulled = false; root.add(im);
    return im;
  }
  function sea(root, o) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.w || 900, o.d || 900).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: o.color || '#5aa3c6', gradientMap: TK.grad }));
    m.position.set(o.x || 0, o.y || -1.4, o.z || 0); m.receiveShadow = false; root.add(m); return m;
  }
  // round trees, instanced (vertex colors)
  const TREE = (() => TK.merge([{ geo: new THREE.CylinderGeometry(0.18, 0.28, 2.2, 7), m: M4(0, 1.1, 0, 1), color: '#8a5f3e' },
    ...[[0, 2.8, 0, 1.15], [0.8, 2.5, 0.3, 0.9], [-0.75, 2.6, -0.2, 0.95], [0.2, 3.5, -0.3, 0.85], [-0.3, 2.4, 0.8, 0.8]].map(([x, y, z, r], i) => ({ geo: G.ico1, m: M4(x, y, z, r), color: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346'][i] }))]))();
  function trees(root, list) {
    const im = new THREE.InstancedMesh(TREE, vcMat(true), list.length), col = new THREE.Color();
    list.forEach((t, i) => { im.setMatrixAt(i, M4(t.x, 0, t.z, t.s || 1, t.s || 1, t.s || 1, t.ry || i)); im.setColorAt(i, col.setRGB(t.k || 1, t.k || 1, t.k || 1)); });
    im.castShadow = true; im.frustumCulled = false; root.add(im); return im;
  }
  // ------------------------------------------------------------ the tram: two cars in cream and teal with a pantograph, a destination board
  function tram(dest) {
    const g = new THREE.Group(), Bt = Batch(), TEAL = '#2f8f8a', CREAM = '#f4ecd8';
    for (const [x0, len] of [[-4.2, 8], [4.2, 8]]) {
      Bt.box(x0, 1.55, 0, len - 0.3, 2.3, 2.5, CREAM, { ink: 0.05 }); Bt.box(x0, 0.55, 0, len - 0.3, 0.5, 2.55, TEAL, { ink: 0.03 }); Bt.box(x0, 2.78, 0, len - 0.5, 0.2, 2.4, TEAL, { ink: 0.03 });
      for (let i = 0; i < 4; i++) { const x = x0 - len / 2 + 1.2 + i * 1.85; for (const s of [-1, 1]) Bt.box(x, 1.85, s * 1.27, 1.4, 1.0, 0.06, '#9fd2e6', { ink: 0 }); }
      for (const s of [-1, 1]) Bt.box(x0 + len / 2 - 1.4, 1.2, s * 1.28, 1.1, 1.9, 0.06, '#e8b83e', { ink: 0 });
      for (const s of [-1, 1]) Bt.cyl(x0 + s * 2.4, 0.3, 0, 0.32, 2.4, '#3a3440', { rx: Math.PI / 2, ink: 0 });
    }
    Bt.box(8.1, 1.9, 0, 0.12, 1.3, 2.0, '#9fd2e6', { ink: 0 }); Bt.box(-8.1, 1.9, 0, 0.12, 1.3, 2.0, '#9fd2e6', { ink: 0 });
    Bt.box(0, 3.15, 0, 1.2, 0.08, 0.08, '#3a3440', { ink: 0 }); Bt.box(0, 3.55, 0, 0.06, 0.8, 0.06, '#3a3440', { ink: 0, rz: 0.5 }); Bt.box(0, 3.95, 0, 1.6, 0.06, 0.4, '#3a3440', { ink: 0 });
    Bt.build(g, { fade: false });
    const board = sign(dest || '2', 2.2, 0.42, { bg: '#1b1a22', fg: '#ffcf5a', edge: '#1b1a22', px: 256 }); board.position.set(8.17, 2.62, 0); board.rotation.y = Math.PI / 2; g.add(board);
    g.userData.board = board;
    return g;
  }
  // a lamp post and a bench (pieces into a batch)
  const lamp = (Bt, x, z) => { Bt.cyl(x, 2.0, z, 0.09, 4.0, '#3a3a4a', { ink: 0.02 }); Bt.box(x, 4.05, z, 0.5, 0.12, 0.5, '#3a3a4a', { ink: 0.02 }); Bt.box(x, 3.8, z, 0.36, 0.36, 0.36, '#fff1c8', { ink: 0.02 }); };
  const bench = (Bt, x, z, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry); Bt.box(x, 0.45, z, 1.8, 0.1, 0.5, '#b5794a', { ry }); Bt.box(x - s * 0.24, 0.75, z - c * 0.24, 1.8, 0.45, 0.08, '#b5794a', { ry }); for (const d of [-0.75, 0.75]) Bt.box(x + c * d, 0.22, z - s * d, 0.08, 0.44, 0.45, '#3a3440', { ry }); };
  const planter = (Bt, x, z, w = 1.6) => { Bt.box(x, 0.3, z, w, 0.6, 0.7, '#9a6a43'); for (let i = 0; i < 5; i++) Bt.ball(x - w / 2 + 0.2 + i * (w - 0.4) / 4, 0.75, z, 0.28, 0.22, 0.28, ['#ff8fb1', '#ffd84a', '#5aa84a', '#ff7a5c', '#5aa84a'][i], { ink: 0.01 }); };
  // the paving: big flat colored boxes (no dither: the ground never hides you)
  function ground(root, rects) {
    const Bt = Batch();
    for (const r of rects) Bt.box((r[0] + r[1]) / 2, (r[4] || 0) - 0.06, (r[2] + r[3]) / 2, r[1] - r[0], 0.12 + (r[5] || 0), r[3] - r[2], r[6] || '#d8cbb4', { ink: 0 });
    const m = Bt.build(root, { fade: false, shadow: false, hull: false })[0]; if (m) m.receiveShadow = true; return m;
  }
  // a little map painter: rects and circles in pad coordinates
  function painter(w, d) {
    const ops = [];
    return {
      rect(x0, x1, z0, z1, c, ink) { ops.push(['r', x0, x1, z0, z1, c, ink]); return this; },
      circ(x, z, r, c, ink) { ops.push(['c', x, z, r, c, ink]); return this; },
      line(pts, c, wd) { ops.push(['l', pts, c, wd]); return this; },
      draw(ctx, K) {
        const X = x => (x + w / 2) * K, Z = z => (z + d / 2) * K;
        for (const o of ops) {
          ctx.lineWidth = Math.max(1, K * 0.35); ctx.strokeStyle = 'rgba(43,34,53,0.75)';
          if (o[0] === 'r') { ctx.fillStyle = o[5]; ctx.fillRect(X(o[1]), Z(o[3]), (o[2] - o[1]) * K, (o[4] - o[3]) * K); if (o[6]) ctx.strokeRect(X(o[1]), Z(o[3]), (o[2] - o[1]) * K, (o[4] - o[3]) * K); }
          else if (o[0] === 'c') { ctx.fillStyle = o[4]; ctx.beginPath(); ctx.arc(X(o[1]), Z(o[2]), o[3] * K, 0, TAU2); ctx.fill(); if (o[5]) ctx.stroke(); }
          else { ctx.strokeStyle = o[2]; ctx.lineWidth = o[3] * K; ctx.lineCap = 'round'; ctx.beginPath(); o[1].forEach(([x, z], i) => (i ? ctx.lineTo(X(x), Z(z)) : ctx.moveTo(X(x), Z(z)))); ctx.stroke(); }
        }
      },
    };
  }
  // the noise over a crowd: jagged scribble balloons (sprites) bobbing over heads, in loud colors
  const SCRIB = [];
  function scribTex(i) {
    if (SCRIB[i]) return SCRIB[i];
    const cols = ['#ff5aa0', '#ffd23f', '#3ee0d0', '#ff7a3c', '#9b7bff', '#7be05a'];
    return (SCRIB[i] = TK.canvasTex(128, 96, (c, w, h) => {
      const R = rng(31 + i * 7); c.fillStyle = cols[i % cols.length]; c.strokeStyle = INK; c.lineWidth = 5; c.lineJoin = 'round';
      c.beginPath(); const n = 14; for (let k = 0; k <= n; k++) { const a = k / n * TAU2, r = (k % 2 ? 0.36 : 0.46) * h; c.lineTo(w / 2 + Math.cos(a) * r * 1.25, h * 0.46 + Math.sin(a) * r * 0.9); } c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(w * 0.42, h * 0.8); c.lineTo(w * 0.36, h * 0.98); c.lineTo(w * 0.54, h * 0.82); c.fill(); c.stroke();
      c.lineWidth = 4; for (let k = 0; k < 3; k++) { c.beginPath(); const y = h * (0.32 + k * 0.13); c.moveTo(w * 0.3, y); for (let x = 0; x < 9; x++) c.lineTo(w * (0.3 + x * 0.05), y + (R() - 0.5) * 9); c.stroke(); }
      if (i % 3 === 0) { c.fillStyle = INK; c.font = '900 40px sans-serif'; c.textAlign = 'center'; c.fillText('!', w * 0.78, h * 0.5); }
    }));
  }
  function noiseCloud(root, x, z, n = 6) {
    const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    const sp = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: scribTex(i), transparent: true, depthWrite: false })); s.scale.set(1.3, 1.0, 1); g.add(s); sp.push({ s, ph: i * 1.7, r: 0.8 + (i % 3) * 0.9, y: 2.4 + (i % 4) * 0.35 }); }
    return { g, sp, on: 1, anim(t) { for (const p of sp) { const a = t * 0.6 + p.ph; p.s.position.set(Math.cos(a) * p.r, p.y + Math.sin(t * 3 + p.ph) * 0.15, Math.sin(a) * p.r * 0.7); const k = this.on * (0.85 + 0.15 * Math.sin(t * 9 + p.ph)); p.s.scale.set(1.3 * k, 1.0 * k, 1); p.s.visible = this.on > 0.02; } } };
  }

  // ================================================================ the districts
  const B = {};
  // ---------------------------------------------------------------- Barrio del Faro: the little station, the plaza, the tram stop, your street
  B.centro = (P, T) => {
    const root = new THREE.Group(), Bt = Batch(), solids = [], signs = [], spots = {};
    const S = (x, z, hw, hd, rot = 0) => solids.push({ obox: 1, x: P.x + x, z: P.z + z, hw, hd, rot });
    const C = (x, z, r) => solids.push({ x: P.x + x, z: P.z + z, r });
    // the ground: the station's platform, the plaza's flags, the street, the sidewalks, the tram's lane
    ground(root, [[-42, 42, -36, 36, 0, 0, '#cbbfa8'], [-20, 14, -30, -25, 0.3, 0.3, '#ddd0b8'], [-18, 22, -24, -8, 0.02, 0, '#e3d6bf'], [-5, 5, -8, 36, 0.01, 0, '#8f8a8e'], [-8, -5, -8, 36, 0.05, 0.08, '#d8cdb8'], [5, 8, -8, 36, 0.05, 0.08, '#d8cdb8'],
      [26, 34, -36, 36, 0.01, 0, '#9a948c'], [-42, 42, -36, -31, 0.01, 0, '#a89c8a']]);
    // the railway along the north edge (the line home), the platform's white edge
    for (let x = -42; x < 42; x += 1.4) Bt.box(x, 0.06, -33, 0.5, 0.12, 2.6, '#7b5a42', { ink: 0 });
    for (const z of [-33.75, -32.25]) Bt.box(0, 0.2, z, 84, 0.12, 0.12, '#7f828c', { ink: 0 });
    Bt.box(-3, 0.31, -29.85, 34, 0.04, 0.3, '#f6f0e1', { ink: 0 });
    // the station house (the opening's: plaster, timber, a slate roof, a green door), its canopy and clock
    Bt.box(1, 2.0, -27.4, 8, 3.4, 3.2, '#f5e8cd').roof(1, 3.7, -27.4, 8.4, 1.6, 3.6, '#5d7799');
    for (const x of [-3, 5]) Bt.box(x, 2.0, -25.75, 0.18, 3.4, 0.18, '#8a5f3e', { ink: 0.02 });
    Bt.box(-1.2, 1.25, -25.78, 1.0, 1.9, 0.08, '#3e7a58', { ink: 0.02 }); Bt.box(2.6, 1.8, -25.78, 1.6, 1.0, 0.08, '#a8e1f0', { ink: 0.02 });
    Bt.box(1, 3.0, -24.2, 10, 0.12, 2.8, '#5d7799', { ink: 0.03, rx: -0.08 }); for (const x of [-3.6, 5.6]) Bt.cyl(x, 1.6, -23.1, 0.07, 2.6, '#2f5a48', { ink: 0.02 });
    S(1, -27.4, 4.1, 1.7); C(-3.6, -23.1, 0.15); C(5.6, -23.1, 0.15);
    const clockT = TK.canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#fbf7ec'; c.beginPath(); c.arc(64, 64, 60, 0, TAU2); c.fill(); c.strokeStyle = INK; c.lineWidth = 6; c.stroke(); c.lineCap = 'round'; const hand = (a, r, lw) => { c.lineWidth = lw; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.sin(a) * r, 64 - Math.cos(a) * r); c.stroke(); }; hand(0, 30, 7); hand(0, 46, 4); });
    const clock = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ map: clockT })); clock.position.set(1, 3.3, -25.7); root.add(clock);
    const st = sign(T.sign('station'), 5.6, 0.8, { bg: '#2f5a48', fg: '#fff7e6' }); st.position.set(1, 4.25, -25.68); root.add(st); signs.push({ k: 'station', x: 1, z: -24.4 });
    // planters and benches on the platform and in the plaza; the fountain
    planter(Bt, -10, -26.5); planter(Bt, 10, -26.5); bench(Bt, -14, -26.6); bench(Bt, 12.5, -11, Math.PI); bench(Bt, -12, -11, Math.PI); C(-10, -26.5, 0.9); C(10, -26.5, 0.9); C(12.5, -11, 1.0); C(-12, -11, 1.0); C(-14, -26.6, 1.0);
    Bt.cyl(2, 0.35, -16, 2.4, 0.7, '#d8d0c0').cyl(2, 0.72, -16, 2.0, 0.06, '#6fb6d8', { ink: 0 }).cyl(2, 1.3, -16, 0.35, 1.3, '#d8d0c0').cyl(2, 2.0, -16, 0.8, 0.18, '#d8d0c0'); C(2, -16, 2.5);
    for (const [x, z] of [[-16, -22], [20, -22], [-16, -9], [20, -9], [-6.5, 4], [6.5, 4], [-6.5, 18], [6.5, 18], [-6.5, 31], [6.5, 31]]) { lamp(Bt, x, z); C(x, z, 0.2); }
    // the tram's lane, rails and stop (east of the plaza)
    for (const x of [29.25, 30.75]) Bt.box(x, 0.06, 0, 0.1, 0.1, 72, '#7f828c', { ink: 0 });
    Bt.box(26.6, 1.3, -13, 0.12, 2.6, 4.6, '#a9d4e4', { ink: 0.02 }).box(26, 2.75, -13, 1.6, 0.14, 5.0, '#2f8f8a', { ink: 0.03 }); for (const z of [-15.3, -10.7]) Bt.cyl(25.5, 1.35, z, 0.06, 2.7, '#3a3440', { ink: 0.02 });
    S(26.6, -13, 0.2, 2.4);
    const tb = sign(T.sign('tram'), 4.4, 1.1, { bg: '#2f8f8a', fg: '#fffaf0', px: 640 }); tb.position.set(26.52, 1.7, -13); tb.rotation.y = -Math.PI / 2; root.add(tb); signs.push({ k: 'tram', x: 25.2, z: -13 });
    Bt.box(24.6, 0.8, -8.6, 0.7, 1.6, 0.5, '#2f8f8a', { ink: 0.03 }).box(24.6, 1.25, -8.33, 0.5, 0.42, 0.05, '#bfe8f2', { ink: 0 }); S(24.6, -8.6, 0.4, 0.3);
    spots.machine = { x: 24.6, z: -7.6 }; spots.stop = { x: 28, z: -13, yaw: -Math.PI / 2 }; spots.tramAt = { x: 30, z: -13, ry: Math.PI / 2 };
    // your street, both sides: shops on the ground floors, flats above
    const BLD = [
      { x: -14, z: -2, w: 12, d: 11.6, fl: 3, wall: '#e8b9a0', face: 'e', shop: { awn: '#3f8a6a' }, doorAt: -2.5, sign: 'pet', shutters: '#3f8a6a' },
      { x: -14, z: 10.2, w: 12, d: 11.6, fl: 4, wall: '#f2d8a0', face: 'e', shop: { awn: '#d9a03a' }, doorAt: 2.5, sign: 'bakery', balcony: true },
      { x: -14, z: 25, w: 12, d: 16, fl: 4, wall: '#c9d6e0', face: 'e', door: true, roof: 'tile', shutters: '#c9553f' },
      { x: 16, z: -2.4, w: 16, d: 11, fl: 3, wall: '#f1e0c2', face: 'w', shop: { awn: '#c9443a' }, doorAt: -2.5, sign: 'shop', tank: true },
      { x: 16, z: 9.8, w: 16, d: 11.4, fl: 4, wall: '#a9cbb6', face: 'w', door: true, doorAt: -1.4, doorC: '#2f7a4a', sign: 'home', balcony: true, shutters: '#2f7a4a' },
      { x: 16, z: 24.5, w: 16, d: 15, fl: 3, wall: '#e4c0d4', face: 'w', shop: { awn: '#6f5a9a' }, doorAt: 3, sign: 'laundry', roof: 'tile' },
      { x: -28, z: -14, w: 14, d: 12, fl: 5, wall: '#e9d7c2', face: 'e', door: true, balcony: true },
      { x: -30, z: 6, w: 10, d: 24, fl: 6, wall: '#d9c6b0', face: 'e' },
      { x: -30, z: 26, w: 10, d: 14, fl: 5, wall: '#efe2cd', face: 'e', roof: 'tile' },
    ];
    for (const b of BLD) { const r = building(Bt, b); S(b.x, b.z, r.hw, r.hd); }
    const signAt = (k, x, z, ry, w = 3.6) => { const s = sign(T.sign(k), w, 0.62, { bg: '#fdf6ea' }); s.position.set(x, 3.25, z); s.rotation.y = ry; root.add(s); signs.push({ k, x: x + Math.sin(ry) * 1.6, z: z + Math.cos(ry) * 1.6 }); };
    signAt('pet', -7.85, -2, Math.PI / 2); signAt('bakery', -7.85, 10.2, Math.PI / 2); signAt('shop', 7.85, -2.4, -Math.PI / 2); signAt('laundry', 7.85, 24.5, -Math.PI / 2);
    { const s = sign(T.sign('home'), 1.6, 0.42, { bg: '#2f7a4a', fg: '#fffaf0', px: 256 }); s.position.set(7.86, 2.6, 8.4); s.rotation.y = -Math.PI / 2; root.add(s); signs.push({ k: 'home', x: 6.4, z: 6.6 }); }
    { const s = sign(T.sign('street'), 2.4, 0.5, { bg: '#2f5f8a', fg: '#fffaf0', px: 256 }); s.position.set(-6.0, 2.9, -7.6); root.add(s); Bt.cyl(-6.0, 1.6, -7.7, 0.06, 3.0, '#3a3440', { ink: 0.02 }); C(-6.0, -7.7, 0.15); signs.push({ k: 'street', x: -5.2, z: -6.3 }); }
    spots.home = { x: 6.6, z: 8.4, yaw: -Math.PI / 2 }; spots.pet = { x: -6.6, z: -4.5, yaw: Math.PI / 2 }; spots.platform = { x: 1, z: -27.0, yaw: Math.PI };
    // the bay at the street's south end: a railing, the sea far below, the old lighthouse on its cape
    Bt.box(0, 0.5, 34.5, 70, 1.0, 0.3, '#d8d0c0', { ink: 0.03 }); S(0, 34.5, 35, 0.3);
    const far = new THREE.Group(); root.add(far);
    sea(far, { y: -14, z: 300, w: 1400, d: 600 });
    const LH = Batch(); LH.cyl(70, 2, 150, 9, 10, '#9a8f7a').cyl(70, 16, 150, 2.4, 20, '#fbf7ec').cyl(70, 21, 150, 2.5, 3, '#c9443a').cone(70, 25, 150, 2.8, 3, '#c9443a'); LH.build(far, { fade: false });
    hills(far, { a0: -Math.PI * 0.95, arc: Math.PI * 0.9, r: 200, seed: 21 });
    skyline(far, { a0: -Math.PI * 1.05, arc: Math.PI * 1.1, r0: 70, r1: 160, n: 80, seed: 5 });
    skyline(far, { a0: 0.15, arc: 0.7, r0: 120, r1: 120, n: 18, hmax: 22, seed: 9 });
    // the walls: the pad's edges (the station side, the plaza's west, behind the tram)
    S(-38, 0, 4, 36); S(38, 0, 3, 36);
    Bt.build(root);
    const crowd = [noiseCloud(root, -6, -15, 6), noiseCloud(root, 4, -3, 5)];
    const pm = painter(84, 72).rect(-42, 42, -36, 36, '#e2d6c1').rect(-42, 42, -36, -31, '#b9ac98').rect(-20, 14, -30, -25, '#efe5d2', 1).rect(-18, 22, -24, -8, '#f2ead9').rect(-5, 5, -8, 36, '#a39ea0').rect(26, 34, -36, 36, '#b3aca4').line([[30, -36], [30, 36]], '#6f6a74', 0.6).circ(2, -16, 2.4, '#8fd0ec', 1)
      .rect(-3, 5, -29, -25.8, '#d8b49a', 1).line([[-42, -33], [42, -33]], '#7b5a42', 1);
    for (const b of BLD) pm.rect(b.x - b.w / 2, b.x + b.w / 2, b.z - b.d / 2, b.z + b.d / 2, b.roof === 'tile' ? '#d27445' : '#c9b8a6', 1);
    pm.rect(-42, 42, 34.5, 36, '#7fc0dd');
    return { root, solids, signs, spots, map: (ctx, K) => pm.draw(ctx, K), crowd,
      ground(x, z) { return x > -20 && x < 14 && z > -30 && z < -25 ? 0.3 : 0; },
      walk: [-36, 34, -30, 33.6], anim(dt, t) { crowd.forEach(c => c.anim(t)); } };
  };
  // ---------------------------------------------------------------- Calle del Faro 12: the family's flat (indoors)
  B.casa = (P, T) => {
    const root = new THREE.Group(), Bt = Batch(), solids = [], spots = {};
    const S = (x, z, hw, hd) => solids.push({ obox: 1, x: P.x + x, z: P.z + z, hw, hd, rot: 0 });
    ground(root, [[-9, 9, -7, 7, 0, 0, '#c9a27a']]);
    for (let x = -8.5; x < 9; x += 1.0) Bt.box(x, 0.005, 0, 0.04, 0.01, 14, '#b88f68', { ink: 0 });
    // walls (low on the camera's side), the window with the city, the kitchen, the table, the sofa, shelves, plants, the door
    Bt.box(0, 1.6, -7.1, 18.2, 3.2, 0.2, '#f3e6cf').box(-9.1, 1.6, 0, 0.2, 3.2, 14.2, '#e9d5b8').box(9.1, 1.6, 0, 0.2, 3.2, 14.2, '#e9d5b8').box(0, 0.45, 7.1, 18.2, 0.9, 0.2, '#e9d5b8');
    S(0, -7.1, 9.1, 0.3); S(-9.1, 0, 0.3, 7.1); S(9.1, 0, 0.3, 7.1); S(0, 7.1, 9.1, 0.3);
    Bt.box(-5, 0.5, -6.4, 7.6, 1.0, 1.0, '#f4ecd8').box(-5, 1.02, -6.4, 7.8, 0.08, 1.1, '#6f8fa8', { ink: 0.02 }).box(-6.5, 2.3, -6.75, 3.0, 0.9, 0.5, '#f4ecd8'); S(-5, -6.4, 3.9, 0.6);
    Bt.box(-7.2, 1.15, -6.3, 0.5, 0.25, 0.5, '#c9443a', { ink: 0.02 });
    Bt.box(0, 0.78, 0, 3.4, 0.1, 1.8, '#a8673a').box(-1.5, 0.38, -0.7, 0.1, 0.76, 0.1, '#7a4b2c', { ink: 0 }).box(1.5, 0.38, -0.7, 0.1, 0.76, 0.1, '#7a4b2c', { ink: 0 }).box(-1.5, 0.38, 0.7, 0.1, 0.76, 0.1, '#7a4b2c', { ink: 0 }).box(1.5, 0.38, 0.7, 0.1, 0.76, 0.1, '#7a4b2c', { ink: 0 });
    for (const [x, z] of [[-1.2, -1.3], [1.2, -1.3], [-1.2, 1.3], [1.2, 1.3]]) Bt.box(x, 0.45, z, 0.5, 0.08, 0.5, '#c98a4a', { ink: 0.02 }).box(x, 0.8, z + Math.sign(z) * 0.24, 0.5, 0.6, 0.06, '#c98a4a', { ink: 0.02 });
    S(0, 0, 1.9, 1.3);
    Bt.box(-6.6, 0.4, 3.6, 2.8, 0.6, 1.2, '#4f7fb8').box(-6.6, 0.85, 4.15, 2.8, 0.8, 0.3, '#4f7fb8').box(-7.9, 0.7, 3.6, 0.3, 0.6, 1.2, '#4f7fb8').box(-5.3, 0.7, 3.6, 0.3, 0.6, 1.2, '#4f7fb8'); S(-6.6, 3.7, 1.6, 0.8);
    Bt.box(-6.6, 0.25, 1.8, 1.4, 0.5, 0.8, '#a8673a'); S(-6.6, 1.8, 0.8, 0.5);
    Bt.box(8.6, 1.3, -3, 0.6, 2.6, 3.0, '#8a5f3e'); for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) Bt.box(8.3, 0.4 + i * 0.62, -4.2 + j * 0.6, 0.3, 0.42, 0.18, ['#c9443a', '#3f7fc4', '#e8b83e', '#5fae4f', '#9b7bff'][(i + j) % 5], { ink: 0 }); S(8.6, -3, 0.4, 1.6);
    Bt.cyl(7.8, 0.35, 5.8, 0.35, 0.7, '#c9643f').ball(7.8, 1.1, 5.8, 0.55, 0.6, 0.55, '#5aa84a');
    Bt.box(8.98, 1.1, 4.6, 0.08, 2.2, 1.4, '#7a4b2c', { ink: 0.02 }); spots.door = { x: 7.8, z: 4.6, yaw: Math.PI / 2 };
    Bt.box(-9.0, 1.1, -3.0, 0.08, 2.2, 1.3, '#a8673a', { ink: 0.02 }); spots.room = { x: -8.0, z: -3.0 };
    // the window over the city: a painted view (towers in the noon haze, the bay)
    const view = TK.canvasTex(512, 200, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#7fb6e8'); g.addColorStop(1, '#f3dcb5'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      const R = rng(3); for (let i = 0; i < 26; i++) { const x = R() * w, bw = 18 + R() * 30, bh = 30 + R() * 110; c.fillStyle = ['#e9d7c2', '#d9c6b0', '#c9d2dc', '#e4cdb4'][i % 4]; c.fillRect(x, h - bh, bw, bh); c.fillStyle = 'rgba(79,109,143,.5)'; for (let y = h - bh + 8; y < h - 8; y += 14) c.fillRect(x + 4, y, bw - 8, 5); }
      c.fillStyle = '#5aa3c6'; c.fillRect(0, h * 0.86, w, h * 0.14); });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.0), new THREE.MeshBasicMaterial({ map: view })); win.position.set(3.2, 1.9, -6.98); root.add(win);
    Bt.box(3.2, 1.9, -6.95, 5.5, 0.12, 0.08, '#f4eee2', { ink: 0 }).box(3.2, 0.85, -6.95, 5.5, 0.12, 0.08, '#f4eee2', { ink: 0 }).box(3.2, 2.95, -6.95, 5.5, 0.12, 0.08, '#f4eee2', { ink: 0 });
    const lampL = new THREE.PointLight('#ffd9a0', 0.55, 16, 1.4); lampL.position.set(0, 2.9, 0); root.add(lampL);
    Bt.cyl(0, 2.95, 0, 0.5, 0.25, '#f2c94c', { ink: 0.02 });
    Bt.build(root);
    spots.mom = { x: -1.2, z: -1.9, yaw: 0 }; spots.dad = { x: 1.2, z: -1.9, yaw: 0 }; spots.ollie = { x: 2.3, z: 1.4, yaw: -2.2 }; spots.noa = { x: -2.4, z: 1.2, yaw: 2.4 }; spots.you = { x: 0, z: 2.8, yaw: Math.PI };
    const pm = painter(18, 14).rect(-9, 9, -7, 7, '#d8b48a', 1).rect(-1.7, 1.7, -0.9, 0.9, '#a8673a', 1).rect(-8.8, -1.2, -6.9, -5.9, '#f4ecd8', 1).rect(-8, -5.2, 3, 4.4, '#4f7fb8', 1);
    return { root, solids, signs: [], spots, map: (ctx, K) => pm.draw(ctx, K), ground: () => 0, walk: [-8.6, 8.6, -6.4, 6.6], indoor: true, anim() {} };
  };
  // ---------------------------------------------------------------- Ciudad Universitaria: the quad, the clock tower, Student Services' arcade, the library, the theater
  B.uni = (P, T) => {
    const root = new THREE.Group(), Bt = Batch(), solids = [], signs = [], spots = {};
    const S = (x, z, hw, hd, rot = 0) => solids.push({ obox: 1, x: P.x + x, z: P.z + z, hw, hd, rot });
    const C = (x, z, r) => solids.push({ x: P.x + x, z: P.z + z, r });
    ground(root, [[-45, 45, -36, 36, 0, 0, '#8fbf6a'], [-40, 40, 28, 36, 0.01, 0, '#9a948c'], [-3, 3, -30, 28, 0.02, 0, '#e3d6bf'], [-40, 40, -2, 3, 0.02, 0, '#e3d6bf'], [-24, -18, -24, 8, 0.02, 0, '#e3d6bf'],
      [14, 22, -24, 0, 0.02, 0, '#e3d6bf'], [-36, -8, 6, 26, 0.02, 0, '#d8cbb4']]);
    // the tram's rails and stop along the south edge
    for (const z of [33.25, 34.75]) Bt.box(0, 0.06, z, 90, 0.1, 0.1, '#7f828c', { ink: 0 });
    Bt.box(-4, 1.3, 30.6, 4.6, 2.6, 0.12, '#a9d4e4', { ink: 0.02 }).box(-4, 2.75, 31.2, 5.0, 0.14, 1.6, '#2f8f8a', { ink: 0.03 }); S(-4, 30.6, 2.4, 0.2);
    { const tb = sign(T.sign('tram'), 4.4, 1.1, { bg: '#2f8f8a', fg: '#fffaf0', px: 640 }); tb.position.set(-4, 1.7, 30.52); tb.rotation.y = Math.PI; root.add(tb); signs.push({ k: 'tram', x: -4, z: 29.2 }); }
    spots.stop = { x: -1, z: 32, yaw: Math.PI }; spots.tramAt = { x: -4, z: 34, ry: 0 };
    // the clock tower in the middle of the quad's north side
    Bt.box(0, 7, -22, 5, 14, 5, '#e8d6b8').box(0, 14.4, -22, 5.6, 0.8, 5.6, '#f4eee2').box(0, 16.4, -22, 4.2, 3.2, 4.2, '#e8d6b8').cone(0, 19.6, -22, 3.4, 3.2, '#c9643f'); S(0, -22, 2.7, 2.7);
    const ct = TK.canvasTex(128, 128, (c) => { c.fillStyle = '#fbf7ec'; c.beginPath(); c.arc(64, 64, 60, 0, TAU2); c.fill(); c.strokeStyle = INK; c.lineWidth = 6; c.stroke(); c.lineCap = 'round'; c.lineWidth = 7; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 34); c.stroke(); c.lineWidth = 4; c.beginPath(); c.moveTo(64, 64); c.lineTo(88, 72); c.stroke(); });
    for (const [x, z, ry] of [[0, -19.48, 0], [2.52, -22, Math.PI / 2], [-2.52, -22, -Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ map: ct })); m.position.set(x, 16.4, z); m.rotation.y = ry; root.add(m); }
    // Student Services: an arcade with four windows facing the quad (east)
    building(Bt, { x: -32, z: -9, w: 14, d: 30, fl: 3, wall: '#f2e2c4', face: 'n', roof: 'tile', roofC: '#c9643f', sills: true }); S(-32, -9, 7.1, 15.1);
    Bt.box(-24.2, 3.1, -9, 0.4, 0.3, 30, '#f4eee2', { ink: 0.03 }); for (let z = -23; z <= 5; z += 4) { Bt.cyl(-23.6, 1.5, z, 0.25, 3.0, '#f4eee2', { ink: 0.02 }); C(-23.6, z, 0.3); }
    const WINS = [-16, -11, -6, -1];
    WINS.forEach((z, i) => { Bt.box(-24.9, 1.4, z, 0.1, 1.5, 2.2, '#a9d4e4', { ink: 0.02 }).box(-24.85, 0.95, z, 0.6, 0.08, 2.4, '#8a5f3e', { ink: 0.02 }); const s = sign(String(i + 1), 0.5, 0.5, { bg: '#3f7fc4', fg: '#fffaf0', px: 128 }); s.position.set(-24.85, 2.45, z); s.rotation.y = Math.PI / 2; root.add(s); });
    spots.win = WINS.map(z => ({ x: -22.6, z, yaw: -Math.PI / 2 })); spots.ortega = { x: -24.4, z: -6, yaw: Math.PI / 2 };     // (she leans out of window 3, under the arcade)
    { const s = sign(T.sign('office'), 6, 0.9, { bg: '#3f7fc4', fg: '#fffaf0', px: 768 }); s.position.set(-24.95, 3.7, -9); s.rotation.y = Math.PI / 2; root.add(s); signs.push({ k: 'office', x: -22.4, z: -8 }); }
    Bt.box(-21.6, 0.7, 7, 0.6, 1.4, 0.5, '#3f7fc4', { ink: 0.03 }).box(-21.6, 1.2, 6.74, 0.42, 0.36, 0.05, '#e8f4ff', { ink: 0 }); S(-21.6, 7, 0.35, 0.3); spots.machine = { x: -21.6, z: 8.1 };
    bench(Bt, -19.5, -12, Math.PI / 2); bench(Bt, -19.5, -4, Math.PI / 2); C(-19.5, -12, 1); C(-19.5, -4, 1);
    // the library (east) with its steps, and the mail cart under the porch
    building(Bt, { x: 31, z: -14, w: 18, d: 20, fl: 3, wall: '#d9c6b0', face: 'w', door: true, roof: 'tile', roofC: '#8a5f3e' }); S(31, -14, 9.1, 10.1);
    for (let i = 0; i < 3; i++) Bt.box(21.4 - i * 0.6, 0.12 + i * 0.12, -14, 0.6, 0.24 + i * 0.24, 6, '#e8e0d0', { ink: 0.02 });
    for (const z of [-17, -11]) { Bt.cyl(21.2, 2.4, z, 0.3, 4.8, '#f4eee2', { ink: 0.02 }); C(21.2, z, 0.35); }
    Bt.box(21.2, 4.95, -14, 1.2, 0.2, 7.0, '#f4eee2', { ink: 0.03 });
    { const s = sign(T.sign('library'), 5.0, 0.8, { bg: '#5a3f2a', fg: '#fff3d8', px: 640 }); s.position.set(21.95, 4.1, -14); s.rotation.y = -Math.PI / 2; root.add(s); signs.push({ k: 'library', x: 19.4, z: -14 }); }
    Bt.box(19.6, 0.55, -9.4, 1.4, 0.7, 0.9, '#8a8a96').box(19.6, 0.12, -9.4, 1.4, 0.06, 0.9, '#3a3440', { ink: 0 }).box(19.6, 1.0, -9.4, 1.2, 0.3, 0.7, '#f4ecd8', { ink: 0.02 }); C(19.6, -9.4, 0.8);
    spots.cart = { x: 18.4, z: -9.2, yaw: Math.PI / 2 }; spots.rocio = { x: 20.6, z: -12.4, yaw: -Math.PI / 2 };
    // the science building (north-east), the café kiosk, its tables, the notice board
    building(Bt, { x: 24, z: -31, w: 22, d: 8, fl: 4, wall: '#c9d6e0', face: 's', door: true, balcony: true }); S(24, -31, 11.1, 4.1);
    { const s = sign(T.sign('lab'), 5.0, 0.7, { bg: '#2f5f8a', fg: '#fffaf0', px: 640 }); s.position.set(24, 3.4, -26.92); root.add(s); signs.push({ k: 'lab', x: 24, z: -25.4 }); }
    spots.lab = { x: 20, z: -25.2, yaw: 0 };
    Bt.box(27, 1.4, 14, 5, 2.8, 3.4, '#f2c94c').box(27, 2.95, 14, 6, 0.2, 4.4, '#c9443a', { ink: 0.03 }); S(27, 14, 2.6, 1.8);
    { const s = sign(T.sign('cafe'), 4.0, 0.7, { bg: '#fdf6ea' }); s.position.set(24.45, 2.3, 14); s.rotation.y = -Math.PI / 2; root.add(s); signs.push({ k: 'cafe', x: 22.8, z: 14 }); }
    for (const [x, z] of [[20, 10], [20, 17], [16, 13.5]]) { Bt.cyl(x, 0.72, z, 0.6, 0.06, '#f4ecd8').cyl(x, 0.36, z, 0.06, 0.72, '#3a3440', { ink: 0 }); C(x, z, 0.65); }
    spots.notebook = { x: 20, z: 17, y: 0.78 }; spots.ivan = { x: 18.2, z: -24.6, yaw: Math.PI };
    Bt.box(8, 1.2, 4.6, 3.2, 1.8, 0.14, '#8a5f3e').box(8, 1.25, 4.52, 2.9, 1.5, 0.06, '#e9dcc4', { ink: 0 }); for (const x of [6.6, 9.4]) Bt.cyl(x, 0.6, 4.6, 0.06, 1.2, '#5a3a24', { ink: 0 }); S(8, 4.6, 1.7, 0.2);
    for (let i = 0; i < 5; i++) Bt.box(6.9 + (i % 3) * 1.0, 1.4 - ((i / 3) | 0) * 0.6, 4.49, 0.6, 0.45, 0.02, ['#fff3a0', '#bfe8f2', '#ffd0d8', '#e8ffd0', '#f4ecd8'][i], { ink: 0 });
    signs.push({ k: 'notice', x: 8, z: 5.9 });
    // the open-air theater (south-west): a stage and three tiers of seats facing it (you can climb them)
    const TH = { x: -22, z: 16 };
    Bt.box(TH.x, 0.3, TH.z - 5.2, 9, 0.6, 3.2, '#c9a27a').box(TH.x, 3.0, TH.z - 7.0, 9.4, 0.16, 0.4, '#8a5f3e', { ink: 0.02 }); for (const x of [-4.4, 4.4]) Bt.cyl(TH.x + x, 1.5, TH.z - 6.8, 0.15, 3.0, '#8a5f3e', { ink: 0.02 });
    for (let k = 0; k < 3; k++) { const r0 = 4 + k * 2.2; for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.9 + i * Math.PI * 0.8 / 8 + Math.PI * 0.55; const x = TH.x + Math.cos(a) * r0, z = TH.z - 5 + Math.sin(a) * r0; Bt.box(x, 0.15 + k * 0.25, z, 2.4, 0.3 + k * 0.5, 1.9, k % 2 ? '#d8cbb4' : '#e3d6bf', { ink: 0.02, ry: -a + Math.PI / 2 }); } }
    { const s = sign(T.sign('theater'), 5.4, 0.8, { bg: '#7a3f5a', fg: '#fff3d8', px: 640 }); s.position.set(TH.x, 3.6, TH.z - 7.05); root.add(s); signs.push({ k: 'theater', x: TH.x + 3.6, z: TH.z - 3.4 }); }
    spots.stage = { x: TH.x, z: TH.z - 5.6, y: 0.6 }; spots.seat = { x: TH.x + 1, z: TH.z + 0.4, yaw: Math.PI }; spots.theater = TH;
    // the university's sign by the stop, trees, lamps
    { const s = sign(T.sign('uni'), 7.0, 1.0, { bg: '#7a3f5a', fg: '#fff3d8', px: 768 }); s.position.set(6, 2.2, 27.6); s.rotation.y = Math.PI; root.add(s); Bt.box(6, 1.1, 27.7, 7.4, 2.4, 0.3, '#e8d6b8'); S(6, 27.7, 3.7, 0.3); signs.push({ k: 'uni', x: 6, z: 26.2 }); }
    const TR = [[-10, -12], [10, -12], [-12, 18], [12, 22], [-36, 24], [-38, 12], [36, 6], [38, 24], [-8, -28], [8, -28], [-16, -28], [36, -2], [14, 26], [-30, 30]].map(([x, z], i) => ({ x, z, s: 1.1 + (i % 3) * 0.25, k: 0.9 + (i % 4) * 0.06 }));
    trees(root, TR); TR.forEach(t => C(t.x, t.z, 0.5));
    for (const [x, z] of [[-4, -8], [4, -8], [-4, 12], [4, 12], [14, -1], [-14, -1]]) { lamp(Bt, x, z); C(x, z, 0.2); }
    // the far campus and the hills
    const far = new THREE.Group(); root.add(far);
    hills(far, { a0: -Math.PI, arc: Math.PI, r: 190, seed: 33 }); skyline(far, { a0: 0, arc: Math.PI, r0: 80, r1: 140, n: 60, seed: 17, hmax: 30 });
    S(-44, 0, 2, 36); S(44, 0, 2, 36); S(0, -35.5, 45, 1.2);
    Bt.build(root);
    const crowd = [noiseCloud(root, -14, -6, 6), noiseCloud(root, 15, -10, 5), noiseCloud(root, TH.x, TH.z - 1, 7)];
    crowd[2].on = 0;
    const pm = painter(90, 72).rect(-45, 45, -36, 36, '#a6cf86').rect(-40, 40, 28, 36, '#b3aca4').line([[-45, 34], [45, 34]], '#6f6a74', 0.6).rect(-3, 3, -30, 28, '#efe5d2').rect(-40, 40, -2, 3, '#efe5d2')
      .rect(-39, -25, -24, 6, '#d27445', 1).rect(22, 40, -24, -4, '#a8673a', 1).rect(13, 35, -35, -27, '#c9b8a6', 1).rect(-2.5, 2.5, -24.5, -19.5, '#c9643f', 1).rect(24.5, 29.5, 12.3, 15.7, '#e8b83e', 1).circ(TH.x, TH.z - 4, 8, '#e3d6bf', 1).rect(TH.x - 4.5, TH.x + 4.5, TH.z - 6.8, TH.z - 3.6, '#c9a27a', 1);
    TR.forEach(t => pm.circ(t.x, t.z, 1.6, '#5aa84a', 1));
    return { root, solids, signs, spots, map: (ctx, K) => pm.draw(ctx, K), crowd,
      ground(x, z) {
        if (x > TH.x - 4.5 && x < TH.x + 4.5 && z > TH.z - 6.8 && z < TH.z - 3.6) return 0.6;
        const d = Math.hypot(x - TH.x, z - (TH.z - 5)); if (z > TH.z - 4.6 && d > 3 && d < 10.8) return d < 5.1 ? 0.3 : d < 7.3 ? 0.55 : 0.8;
        if (x > 19.2 && x < 21.8 && z > -17 && z < -11) return 0.36;
        return 0;
      },
      walk: [-41, 41, -32, 32.4], anim(dt, t) { crowd.forEach(c => c.anim(t)); } };
  };
  // ---------------------------------------------------------------- Mercado del Puerto: the iron-and-glass market hall, the quay, the boats, the cranes
  B.puerto = (P, T) => {
    const root = new THREE.Group(), Bt = Batch(), solids = [], signs = [], spots = {};
    const S = (x, z, hw, hd, rot = 0) => solids.push({ obox: 1, x: P.x + x, z: P.z + z, hw, hd, rot });
    const C = (x, z, r) => solids.push({ x: P.x + x, z: P.z + z, r });
    ground(root, [[-30, 45, -36, 36, 0, 0, '#d1c2a6'], [-20, 16, -16, 16, 0.02, 0, '#bfb3a0'], [36, 44, -36, 36, 0.01, 0, '#9a948c']]);
    for (const x of [39.25, 40.75]) Bt.box(x, 0.06, 0, 0.1, 0.1, 72, '#7f828c', { ink: 0 });
    // the sea west of the quay, the quay's edge, bollards, boats
    const far = new THREE.Group(); root.add(far);
    const water = sea(far, { x: -480, y: -1.3, w: 900, d: 1400, color: '#4f9cc0' });
    Bt.box(-30.4, -0.6, 0, 0.8, 1.4, 72, '#b8ab96', { ink: 0.03 }); S(-31, 0, 1, 36);
    for (let z = -32; z <= 32; z += 8) { Bt.cyl(-29.3, 0.3, z, 0.3, 0.6, '#3a3440', { ink: 0.02 }); C(-29.3, z, 0.35); }
    const boat = (x, z, c, ry = 0) => { Bt.box(x, -0.7, z, 2.4, 0.9, 6.4, c, { ry, ink: 0.04 }).box(x, -0.2, z - 0.4, 1.6, 0.8, 2.0, '#f4ecd8', { ry, ink: 0.03 }).cyl(x, 1.4, z + 1.2, 0.06, 3.4, '#8a5f3e', { ink: 0 }); };
    boat(-34, -18, '#3f7fc4'); boat(-35, -6, '#c9443a', 0.1); boat(-34.4, 10, '#e8b83e', -0.08); boat(-35.2, 22, '#2f8f8a');
    // the hall: iron columns, a long glass roof, the stalls
    for (let x = -18; x <= 14; x += 8) for (const z of [-15, 15]) { Bt.cyl(x, 3.4, z, 0.25, 6.8, '#3f6f6a', { ink: 0.02 }); C(x, z, 0.32); }
    for (const z of [-15, 15]) Bt.box(-2, 6.9, z, 34, 0.3, 0.4, '#3f6f6a', { ink: 0.02 });
    Bt.roof(-2, 7.0, 0, 34.8, 4.0, 31.4, '#9fc9cc', { ry: 0, ink: 0.05 });
    for (let x = -18; x <= 14; x += 4) Bt.box(x, 8.4, 0, 0.12, 0.12, 31.6, '#3f6f6a', { ink: 0 });
    const stall = (x, z, ry, awn, goods, k) => {
      const c = Math.cos(ry), s = Math.sin(ry);
      Bt.box(x, 0.5, z, 4.4, 1.0, 1.6, '#a8673a', { ry }).box(x, 1.05, z, 4.6, 0.1, 1.8, '#c98a4a', { ry, ink: 0.02 });
      for (const d of [-2.1, 2.1]) Bt.cyl(x + c * d, 1.4, z - s * d, 0.07, 2.8, '#3a3440', { ink: 0 });
      Bt.box(x - s * 0.2, 2.75, z - c * 0.2, 4.8, 0.12, 2.4, awn, { ry, rx: 0.18, ink: 0.03 });
      goods.forEach((g, i) => { const d = -1.6 + i * (3.2 / Math.max(1, goods.length - 1)); Bt.ball(x + c * d, 1.3, z - s * d, 0.32, 0.24, 0.32, g, { ink: 0.01 }); });
      S(x, z, 2.3, 0.9, -ry);
      const sg = sign(T.sign(k), 3.6, 0.55, { bg: '#fdf6ea' }); sg.position.set(x - s * 1.34, 2.42, z - c * 1.34); sg.rotation.y = ry + Math.PI; root.add(sg);
      signs.push({ k, x: x - s * 2.1, z: z - c * 2.1 });
      return { x: x - s * 1.7, z: z - c * 1.7, yaw: ry + Math.PI };
    };
    spots.ramon = stall(-10, -8, Math.PI / 2, '#3f7fc4', ['#c8d0d8', '#b8c4cc', '#d8d0c0', '#c9443a', '#c8d0d8'], 'ramon');
    spots.mari = stall(-10, 6, Math.PI / 2, '#2f8f8a', ['#9fb8c8', '#c0d0dc', '#9fb8c8', '#e8b8a0', '#9fb8c8'], 'fish');
    spots.lupita = stall(6, -6, -Math.PI / 2, '#5fae4f', ['#f2a33a', '#e2533f', '#f2c94c', '#e2533f', '#7be05a'], 'fruit');
    stall(6, 8, -Math.PI / 2, '#d9a03a', ['#c9443a', '#e8b83e', '#8a5f3e', '#d27445', '#e8b83e'], 'market');
    // the port office (north-east) and its sign; crates; the cranes far off (Dad's)
    building(Bt, { x: 27, z: -27, w: 14, d: 10, fl: 2, wall: '#f1e0c2', face: 's', door: true, roof: 'tile', roofC: '#3f6f9a' }); S(27, -27, 7.1, 5.1);
    { const s = sign(T.sign('port'), 4.8, 0.7, { bg: '#3f6f9a', fg: '#fffaf0', px: 640 }); s.position.set(27, 2.8, -21.94); root.add(s); signs.push({ k: 'port', x: 27, z: -20.4 }); }
    for (const [x, z] of [[18, 20], [20, 22], [-24, -26], [-22, -27], [30, 24]]) { Bt.box(x, 0.5, z, 1.0, 1.0, 1.0, '#b8864f', { ink: 0.03 }); C(x, z, 0.75); }
    const crane = (x, z, ry) => { const CB = Batch(); CB.box(0, 12, 0, 1.4, 24, 1.4, '#e8b83e').box(6, 24.5, 0, 16, 1.0, 1.2, '#e8b83e').box(-4, 23.5, 0, 4, 2.0, 2.0, '#c9443a').cyl(10, 18, 0, 0.05, 12, '#3a3440', { ink: 0 }); const g = new THREE.Group(); CB.build(g, { fade: false }); g.position.set(x, 0, z); g.rotation.y = ry; far.add(g); };
    crane(-90, -70, 0.4); crane(-70, -110, -0.2); crane(-120, -40, 0.9);
    { const s = sign(T.sign('market'), 8.0, 1.0, { bg: '#2f8f8a', fg: '#fffaf0', px: 768 }); s.position.set(-2, 6.2, 15.2); s.rotation.y = 0; root.add(s); signs.push({ k: 'market', x: -2, z: 17.4 }); }
    { const tb = sign(T.sign('tram'), 4.4, 1.1, { bg: '#2f8f8a', fg: '#fffaf0', px: 640 }); tb.position.set(36.4, 1.7, 0); tb.rotation.y = -Math.PI / 2; root.add(tb); Bt.box(36.5, 1.3, 0, 0.12, 2.6, 4.6, '#a9d4e4', { ink: 0.02 }).box(37.2, 2.75, 0, 1.6, 0.14, 5.0, '#2f8f8a', { ink: 0.03 }); S(36.5, 0, 0.2, 2.4); signs.push({ k: 'tram', x: 35.2, z: 0 }); }
    spots.stop = { x: 38, z: 3.5, yaw: -Math.PI / 2 }; spots.tramAt = { x: 40, z: 0, ry: Math.PI / 2 }; spots.center = { x: -2, z: 0 }; spots.entry = { x: 30, z: 2, yaw: -Math.PI / 2 };
    skyline(far, { a0: Math.PI * 1.1, arc: Math.PI * 0.85, r0: 90, r1: 160, n: 70, seed: 44 });
    hills(far, { a0: Math.PI * 1.2, arc: Math.PI * 0.6, r: 260, seed: 51 });
    S(0, -35, 45, 1.2); S(0, 35, 45, 1.2); S(44, 0, 2, 36);
    Bt.build(root);
    const crowd = [noiseCloud(root, -2, 0, 7), noiseCloud(root, -4, 22, 5), noiseCloud(root, 24, -10, 5)];
    const pm = painter(90, 72).rect(-45, 45, -36, 36, '#ddd0b5').rect(-45, -30.5, -36, 36, '#7fc0dd').rect(-20, 16, -16, 16, '#cfe6e8', 1).rect(36, 44, -36, 36, '#b3aca4').line([[40, -36], [40, 36]], '#6f6a74', 0.6).rect(20, 34, -32, -22, '#3f6f9a', 1);
    for (const [x, z] of [[-10, -8], [-10, 6], [6, -6], [6, 8]]) pm.rect(x - 0.9, x + 0.9, z - 2.3, z + 2.3, '#c98a4a', 1);
    return { root, solids, signs, spots, map: (ctx, K) => pm.draw(ctx, K), crowd, water,
      ground: () => 0, walk: [-29, 41, -32, 32], anim(dt, t) { crowd.forEach(c => c.anim(t)); water.position.y = -1.3 + Math.sin(t * 0.6) * 0.04; } };
  };
  function build(id, P, T) { const f = B[id]; if (!f) return null; const o = f(P, T); o.root.position.set(P.x, P.y, P.z); return o; }
  return { build, U, Batch, sign, signTex, building, skyline, hills, sea, trees, tram, lamp, bench, painter, noiseCloud, vcMat, inkMat, B };
})();
