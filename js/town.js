'use strict';
// Alba, the hillside town: four streets around a plaza with a fountain, lanes, 30-odd houses, the
// inn, the bakery, the bell tower and Bruno's training yard, Rosa's stall and Noa's house, a market
// street, a school, a duck pond, and the townsfolk who live there (a few of them already hushed).
// One global: TOWN.build(scene, env) → { colliders, update, people, landmarks, platforms, objects }.
// Static things are merged by material (vertex colors) with one merged ink hull (each piece blown
// up a little, drawn back-faced in ink, like TK.part does for characters). Townsfolk are drawn with
// one instanced mesh per body part, so the whole town costs a few dozen draw calls.
// Needs THREE (r128), core.js and toonkit.js.

const TOWN = (() => {
  const { G } = TK;
  const GY = 0.25;                                   // the ground is flat at this height inside the town
  const CEN = { x: -10, z: -150 }, RAD = 44, BUILD_R = 40.5;
  const PLAZA = { x: -10, z: -146, r: 12 };
  const P = (x, z) => ({ x, z });
  const LM = {
    gate: P(-9, -106), plaza: P(-10, -146), fountain: P(-10, -146), basket: P(-17.8, -130.2), stall: P(-19, -131), rosa: P(-21, -129),
    noaHouse: P(-27.3, -126.6), bakery: P(4, -158), marta: P(3, -154.5), bellTower: P(-26, -166), yard: P(-26, -157), bruno: P(-24, -154),
    nico: P(-4, -140), eastGate: P(34, -150), westGate: P(-53, -150), northGate: P(-10, -193), inn: P(-2.4, -130), market: P(14, -148),
    school: P(-15, -182), pond: P(9, -178.5), appleTree: P(-24.5, -134.5),
  };

  // ------------------------------------------------------------ small helpers
  const R0 = rng(1105);
  const pick = (a, R = R0) => a[Math.floor(R() * a.length) % a.length];
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  const polyDist = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  // oriented boxes { x, z, hw, hd, rot } (rot = the mesh's rotation.y, as in world.js pushOut)
  const toWorld = (b, lx, lz) => { const c = Math.cos(b.rot), s = Math.sin(b.rot); return [b.x + lx * c + lz * s, b.z - lx * s + lz * c]; };
  const corners = b => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => toWorld(b, a * b.hw, c * b.hd));
  function obbOverlap(a, b, pad = 0) {
    const A = corners({ ...a, hw: a.hw + pad, hd: a.hd + pad }), B = corners(b);
    for (const o of [a, b]) for (const ang of [o.rot, o.rot + Math.PI / 2]) {
      const ax = Math.cos(ang), az = -Math.sin(ang);
      const pa = A.map(([x, z]) => x * ax + z * az), pb = B.map(([x, z]) => x * ax + z * az);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
    return true;
  }
  const rect = (x0, z0, x1, z1) => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, hw: (x1 - x0) / 2, hd: (z1 - z0) / 2, rot: 0 });
  const circleHitsObb = (c, b) => { const cs = Math.cos(b.rot), sn = Math.sin(b.rot); const lx = (c.x - b.x) * cs - (c.z - b.z) * sn, lz = (c.x - b.x) * sn + (c.z - b.z) * cs; return Math.hypot(lx - clamp(lx, -b.hw, b.hw), lz - clamp(lz, -b.hd, b.hd)) < c.r; };

  // ------------------------------------------------------------ the layout (pure data, ready before any scene exists)
  const STREETS = [
    { id: 'main', w: 5, pts: [[-9, -101], [-9.3, -118], [-10, -134]] },
    { id: 'north', w: 4.6, pts: [[-10, -156], [-10, -195]] },
    { id: 'east', w: 5, pts: [[1.4, -146.5], [18, -148.2], [37, -150]] },
    { id: 'west', w: 4.6, pts: [[-21.4, -146.5], [-38, -148.2], [-56, -150]] },
    { id: 'laneSW', w: 3.4, pts: [[-11.4, -119], [-24, -119.6], [-34, -122]], lane: 1 },
    { id: 'laneSE', w: 3.4, pts: [[-7, -121], [6, -121.5], [13.5, -126.5]], lane: 1 },
    { id: 'laneNE', w: 3.4, pts: [[-7.8, -168.5], [8, -168.5], [17, -163.5], [21, -149.5]], lane: 1 },
    { id: 'laneNW', w: 3.4, pts: [[-12.2, -173], [-26, -173], [-37, -168]], lane: 1 },
  ];
  const streetDist = (x, z) => { let d = 1e9; for (const s of STREETS) d = Math.min(d, polyDist(s.pts, x, z) - s.w / 2); return d; };
  const PAVED = [   // round paved squares (the plaza is cobbled; the rest packed earth or flagstones)
    { x: PLAZA.x, z: PLAZA.z, r: PLAZA.r, kind: 'plaza' }, { x: 3.4, z: -153.2, r: 4.6, kind: 'flag' }, { x: -9, z: -107.5, r: 3.6, kind: 'flag' },
    { x: -18.5, z: -127.5, r: 4.4, kind: 'dirt' }, { x: 33, z: -150, r: 3.4, kind: 'flag' },
  ];
  const DIRT = [rect(-32.5, -162, -20.8, -152), rect(-5.8, -135.2, -2.2, -124.8)];   // the training yard, the inn's terrace
  function pavedAt(x, z) {
    let a = 0;
    for (const s of STREETS) a = Math.max(a, 1 - smoothstep(s.w / 2 - 0.25, s.w / 2 + 0.35, polyDist(s.pts, x, z)));
    for (const c of PAVED) a = Math.max(a, 1 - smoothstep(c.r - 0.25, c.r + 0.35, Math.hypot(x - c.x, z - c.z)));
    for (const b of DIRT) if (Math.abs(x - b.x) < b.hw + 0.3 && Math.abs(z - b.z) < b.hd + 0.3) a = 1;
    for (const [[ax, az], [bx, bz]] of PATHS) a = Math.max(a, 1 - smoothstep(0.55, 0.95, segDist(x, z, ax, az, bx, bz)));
    return a;
  }

  // the special buildings, at the places the story needs
  const BAKE_ROT = -0.25, bakeDir = [Math.sin(BAKE_ROT), Math.cos(BAKE_ROT)];
  const FIXED = [
    { kind: 'noa', x: -30, z: -126, w: 5.6, d: 5, rot: Math.PI / 2, floors: 1, wall: '#f7ecd9', roof: '#c9553f' },
    { kind: 'bakery', x: 4 - bakeDir[0] * 3.2, z: -158 - bakeDir[1] * 3.2, w: 8.4, d: 6.4, rot: BAKE_ROT, floors: 2, wall: '#fbe9c8', roof: '#d0663f' },
    { kind: 'inn', x: 1.5, z: -130, w: 10, d: 7, rot: -Math.PI / 2, floors: 2, wall: '#f4e3c6', roof: '#3f7fc9' },
    { kind: 'school', x: -18.5, z: -182, w: 9, d: 6.4, rot: Math.PI / 2, floors: 1, wall: '#f9f1e1', roof: '#4f9a5a' },
    { kind: 'tower', x: -26, z: -166, w: 3.6, d: 3.6, rot: 0 },
  ];
  // market stalls along the east street (shopkeepers stand behind them)
  const eastZ = x => (x < 18 ? lerp(-146.5, -148.2, (x - 1.4) / 16.6) : lerp(-148.2, -150, (x - 18) / 19));
  const STALLS = [
    { x: 7.6, side: 1, goods: 'veg', awn: ['#4f9a5a', '#fff4e4'] }, { x: 12.6, side: 1, goods: 'flowers', awn: ['#e86a9a', '#fff4e4'] },
    { x: 17.6, side: 1, goods: 'cheese', awn: ['#f2b13c', '#fff4e4'] }, { x: 22.8, side: 1, goods: 'pots', awn: ['#3f7fc9', '#fff4e4'] },
    { x: 11.2, side: -1, goods: 'fish', awn: ['#8a8a92', '#d8d8dc'], hushed: true }, { x: 15.8, side: -1, goods: 'bread', awn: ['#d0663f', '#fff4e4'] },
  ].map(s => ({ ...s, z: eastZ(s.x) + s.side * 4.1, rot: s.side > 0 ? Math.PI : 0, w: 3, d: 1.4 }));

  const RESERVED = [
    { c: 1, x: PLAZA.x, z: PLAZA.z, r: PLAZA.r + 1.4 }, { c: 1, x: -9, z: -107, r: 4.6 }, { c: 1, x: 33, z: -150, r: 4.2 },
    { c: 1, x: 3.4, z: -153.2, r: 5.4 }, { c: 1, x: 9, z: -178.5, r: 6.9 }, { c: 1, x: -26, z: -166, r: 3.8 },
    rect(-27, -137, -12.4, -121.6), rect(-33.6, -163.4, -19.6, -151), rect(-6.6, -136, -1.6, -124),
    ...STALLS.map(s => ({ x: s.x, z: s.z, hw: s.w / 2 + 1.4, hd: s.d / 2 + 1.6, rot: 0 })),
  ];
  const WALLS = ['#f6ead6', '#f3e1c4', '#fbf4e6', '#f4d8c8', '#ece4f3', '#dcecd8', '#f8e6ae', '#fdfaf3', '#f6d2c6', '#e7eef4'];
  const ROOFS = ['#c9553f', '#d0663f', '#3f7fc9', '#4f9a5a', '#e08a3a', '#8a5ab0', '#b84a5a', '#3e8f8a', '#c9553f', '#d0663f'];
  const DOORS = ['#8d5733', '#3e7fb0', '#4f8a4a', '#b84a3a', '#7a4f8f', '#2f6f6a', '#c98a2e'];
  const SHUTTERS = ['#4f8a4a', '#3e7fb0', '#b84a3a', '#2f6f6a', '#8a5ab0', '#d9a03a'];
  const HOUSES = [];
  function fits(b) {
    for (const [x, z] of corners(b)) if (Math.hypot(x - CEN.x, z - CEN.z) > BUILD_R) return false;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const [x, z] = toWorld(b, (i / 2) * b.hw, (j / 2) * b.hd); if (streetDist(x, z) < 0.5) return false; }
    for (const r of RESERVED) if (r.c ? circleHitsObb(r, b) : obbOverlap(b, r)) return false;
    for (const o of FIXED.concat(HOUSES)) if (obbOverlap(b, { x: o.x, z: o.z, hw: o.w / 2, hd: o.d / 2, rot: o.rot }, 0.8)) return false;
    return true;
  }
  const PATHS = [];   // footpaths from houses set back from the street: [[x1, z1], [x2, z2]]
  function nearestStreet(x, z) {
    let best = { d: 1e9 };
    for (const s of STREETS) for (let i = 0; i < s.pts.length - 1; i++) {
      const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0.02, 0.98), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz) - s.w / 2;
      if (d < best.d) best = { d, x: px, z: pz, s };
    }
    return best;
  }
  const blockedAt = (x, z, r) => FIXED.concat(HOUSES).some(o => circleHitsObb({ x, z, r }, { x: o.x, z: o.z, hw: o.w / 2, hd: o.d / 2, rot: o.rot }))
    || RESERVED.some(q => q.c ? Math.hypot(x - q.x, z - q.z) < q.r * 0.85 : circleHitsObb({ x, z, r: r * 0.5 }, q));
  // Houses line both sides of every street, facing it, wherever there's room.
  function fillStreet(s, side, setback, R) {
    const pts = s.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      const nx = -uz * side, nz = ux * side, rot = Math.atan2(-nx, -nz);
      let s0 = 0.5;
      while (s0 < L - 2.5) {
        let ok = false;
        for (let tries = 0; tries < 3 && !ok; tries++) {
          const w = (s.lane ? 4.4 : 5.0) + R() * (tries ? 0.8 : 2.6), d = 4.2 + R() * (s.lane ? 0.8 : 1.5), off = s.w / 2 + setback + d / 2 + R() * 0.3;
          const b = { x: ax + ux * (s0 + w / 2) + nx * off, z: az + uz * (s0 + w / 2) + nz * off, hw: w / 2, hd: d / 2, rot };
          if (fits(b)) {
            const two = !s.lane && R() < 0.55;
            HOUSES.push({ kind: 'house', x: b.x, z: b.z, w, d, rot, floors: two ? 2 : 1, street: s.id, seed: R(),
              wall: pick(WALLS, R), roof: pick(ROOFS, R), door: pick(DOORS, R), shutter: pick(SHUTTERS, R),
              style: two ? (R() < 0.5 ? 'timber' : 'stucco') : pick(['cottage', 'stucco', 'timber', 'cottage'], R) });
            s0 += w + 0.9 + R() * 1.4; ok = true;
          }
        }
        if (!ok) s0 += 1.1;
      }
    }
  }
  {
    const R = rng(77);
    const order = [['main', 0.9], ['east', 4.4], ['west', 0.9], ['north', 0.9], ['laneSW', 0.7], ['laneSE', 0.7], ['laneNE', 0.7], ['laneNW', 0.7]];
    for (const [id, setback] of order) { const s = STREETS.find(q => q.id === id); fillStreet(s, 1, setback, R); fillStreet(s, -1, setback, R); }
    // then more houses in the gaps, each facing its nearest street, with a footpath to its door
    for (let n = 0; n < 4000 && HOUSES.length < 36; n++) {
      const a = R() * TAU, r = 14 + Math.sqrt(R()) * 26, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r;
      const np = nearestStreet(x, z);
      if (np.d < 2.5 || np.d > 13) continue;
      const w = 4.4 + R() * 2.0, d = 4.2 + R() * 1.2, rot = Math.atan2(np.x - x, np.z - z);
      const b = { x, z, hw: w / 2, hd: d / 2, rot };
      if (!fits(b)) continue;
      const [dx, dz] = toWorld(b, 0, d / 2 + 0.55), L = Math.hypot(np.x - dx, np.z - dz);
      let clear = true;
      for (let t = 0.6; t < L - 0.5 && clear; t += 0.6) if (blockedAt(dx + (np.x - dx) * t / L, dz + (np.z - dz) * t / L, 0.75)) clear = false;
      if (!clear) continue;
      const two = R() < 0.4;
      HOUSES.push({ kind: 'house', x, z, w, d, rot, floors: two ? 2 : 1, street: 'infill', seed: R(), wall: pick(WALLS, R), roof: pick(ROOFS, R), door: pick(DOORS, R), shutter: pick(SHUTTERS, R),
        style: two ? (R() < 0.5 ? 'timber' : 'stucco') : pick(['cottage', 'stucco', 'timber', 'cottage'], R) });
      PATHS.push([[dx, dz], [np.x, np.z]]);
    }
    // Teo's grandma lives in the blue house
    const blue = HOUSES.find(h => h.street === 'north') || HOUSES[0];
    if (blue) { blue.wall = '#bcd8ea'; blue.roof = '#c9553f'; blue.blue = true; }
  }
  const LAYOUT = { center: CEN, radius: RAD, ground: GY, plaza: PLAZA, streets: STREETS, paved: PAVED, dirt: DIRT, paths: PATHS, buildings: FIXED.concat(HOUSES), stalls: STALLS };

  // ------------------------------------------------------------ materials: the toon look (TK.toon's gradient and rim), plus a
  // dithered fade, so walls between the camera and you (or right at the camera) melt away instead of hiding you
  const U = { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3(0, -1e4, 0) }, uFade: { value: 1 } };
  function patch(o) {
    return sh => {
      const CC = o.fade && TK.camCut;        // (a house the camera's inside goes all at once: its windows, frames, doors too)
      Object.assign(sh.uniforms, U, CC ? CC.U : {}, { rimAmt: { value: o.rim || 0 } });
      let vs = 'uniform float uTime;\nvarying vec3 vWP;\n' + (o.sway ? 'attribute float aSway;\n' : '') + sh.vertexShader;
      if (o.off) vs = vs.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${TK.fl(o.off)};`);
      if (o.sway) vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
        { float ph = position.x * 0.35 + position.z * 0.27;
          transformed.x += sin(uTime * 1.5 + ph) * 0.11 * aSway;
          transformed.z += sin(uTime * 1.1 + ph * 1.7) * 0.08 * aSway; }`);
      vs = vs.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float rimAmt;\nvarying vec3 vWP;\n' + (CC ? CC.decl : '') + sh.fragmentShader;
      if (o.fade) fs = fs.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        ${CC ? CC.test : ''}
        { // the camera, from viewMatrix: three r128 sends cameraPosition only to lit materials, so the ink hulls (basic) never faded
          vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
          vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
          vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
          float occl = step(0.0, along) * step(along, segL - 0.9) * (1.0 - smoothstep(1.3, 2.7, axis)) * smoothstep(0.4, 1.2, vWP.y - uFocus.y + 1.5);
          float nearCam = 1.0 - smoothstep(1.5, 3.4, length(rel));
          if (uFade > 0.5 && nearCam > 0.8) discard;      // (all the way gone right by the camera: a few leftover dots read as specks)
          float fadeAmt = uFade * max(occl * 0.9, nearCam);
          if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`);
      if (o.rim) fs = fs.replace('#include <tonemapping_fragment>', 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function toonM(o = {}) {
    const k = 't' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshToonMaterial({ color: o.color || '#ffffff', gradientMap: TK.grad, vertexColors: !!o.vc, map: o.map || null,
      emissive: new THREE.Color(o.emissive || '#000000'), transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide });
    if (o.poly) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -o.poly; }
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'town' + k;
    return (MATS[k] = m);
  }
  function inkM(o = {}) {
    const k = 'i' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'town' + k;
    return (MATS[k] = m);
  }

  // ------------------------------------------------------------ pieces → merged geometry, and its ink hull
  const NI = new Map(), BBX = new Map();
  const ni = g => { let r = NI.get(g); if (!r) { r = g.index ? g.toNonIndexed() : g; NI.set(g, r); } return r; };
  const bbOf = g => { let r = BBX.get(g); if (!r) { g.computeBoundingBox(); r = { size: g.boundingBox.getSize(new THREE.Vector3()), ctr: g.boundingBox.getCenter(new THREE.Vector3()) }; BBX.set(g, r); } return r; };
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color(), _m3 = new THREE.Matrix3();
  // the hull: the piece blown up by `ink` world units around its own center (exact for boxes, close for round things)
  function hullMatrix(geo, m, ink) {
    const { size, ctr } = bbOf(geo); m.decompose(_p, _q, _s);
    const f = ['x', 'y', 'z'].map(k => { const L = Math.abs(size[k] * _s[k]); return L > 1e-4 ? (L + 2 * ink) / L : 1; });
    return m.clone().multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z)).multiply(new THREE.Matrix4().makeScale(f[0], f[1], f[2]))
      .multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
  }
  // o: { hull, uv (planar world uv scale) }
  function bake(pieces, o = {}) {
    const list = o.hull ? pieces.filter(p => p.ink > 0) : pieces;
    let n = 0; for (const p of list) n += ni(p.geo).attributes.position.count;
    const pos = new Float32Array(n * 3), nor = o.hull ? null : new Float32Array(n * 3), col = o.hull ? null : new Float32Array(n * 3);
    const uv = o.uv ? new Float32Array(n * 2) : null, sw = list.some(p => p.sway) ? new Float32Array(n) : null;
    let at = 0;
    for (const p of list) {
      const g = ni(p.geo), PA = g.attributes.position, NA = g.attributes.normal, cnt = PA.count;
      const m = o.hull ? hullMatrix(p.geo, p.m, p.ink) : p.m;
      if (!o.hull) { _m3.getNormalMatrix(m); _c.set(p.color); }
      for (let i = 0; i < cnt; i++) {
        const j = at + i;
        _v.fromBufferAttribute(PA, i).applyMatrix4(m); pos[j * 3] = _v.x; pos[j * 3 + 1] = _v.y; pos[j * 3 + 2] = _v.z;
        if (uv) { uv[j * 2] = _v.x * o.uv; uv[j * 2 + 1] = _v.z * o.uv; }
        if (sw && p.sway) { const S = p.sway, k = clamp((_v.y - S.y0) / (S.y1 - S.y0), 0, 1); sw[j] = S.k * k * Math.sqrt(k); }
        if (!o.hull) {
          _v.fromBufferAttribute(NA, i).applyMatrix3(_m3).normalize(); nor[j * 3] = _v.x; nor[j * 3 + 1] = _v.y; nor[j * 3 + 2] = _v.z;
          col[j * 3] = _c.r; col[j * 3 + 1] = _c.g; col[j * 3 + 2] = _c.b;
        }
      }
      at += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (nor) { geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    else geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (sw) geo.setAttribute('aSway', new THREE.BufferAttribute(sw, 1));
    geo.computeBoundingSphere();
    return geo;
  }

  // ------------------------------------------------------------ the drawing kit: pieces in a local frame (a house, a stall…)
  // Buckets: solid (toon + ink), sway (toon + ink, moves in the wind), cobble/earth (the ground), water.
  const GEO = {
    box: G.box, cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    cyl20: new THREE.CylinderGeometry(1, 1, 1, 20), ball: new THREE.SphereGeometry(1, 12, 8), ball6: new THREE.SphereGeometry(1, 8, 6), ico0: G.ico0, ico1: G.ico1,
    cone4: (() => { const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; })(),   // a pyramid, base 1/√2 half-side
    cone: new THREE.ConeGeometry(1, 1, 10), cone6: new THREE.ConeGeometry(1, 1, 6), disc: (() => { const g = new THREE.CircleGeometry(1, 28); g.rotateX(-Math.PI / 2); return g; })(),
    disc64: (() => { const g = new THREE.CircleGeometry(1, 64); g.rotateX(-Math.PI / 2); return g; })(),
    ring: (r0) => { const g = new THREE.RingGeometry(r0, 1, 64, 1); g.rotateX(-Math.PI / 2); return g; },
    half: new THREE.SphereGeometry(1, 14, 6, 0, TAU, 0, Math.PI / 2),
    // a triangular prism: ridge along x, base from z −0.5 to 0.5 at y 0, apex at y 1 (gables, roofs)
    prism: (() => {
      const a = [-0.5, 0, -0.5], b = [-0.5, 0, 0.5], c = [-0.5, 1, 0], d = [0.5, 0, -0.5], e = [0.5, 0, 0.5], f = [0.5, 1, 0];
      const tris = [a, b, c, d, f, e, a, d, e, a, e, b, b, e, f, b, f, c, a, c, f, a, f, d];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals(); return g;
    })(),
    torus: new THREE.TorusGeometry(1, 0.22, 6, 16),
    arch: new THREE.TorusGeometry(1, 0.13, 6, 18, Math.PI),
  };
  function Kit() {
    const B = { solid: [], sway: [], cobble: [], earth: [], water: [] };
    let F = new THREE.Matrix4(), FY = 0;
    const autoInk = (geo, sx, sy, sz) => { const { size } = bbOf(geo); const dims = [size.x * sx, size.y * sy, size.z * sz].filter(v => v > 1e-3); return clamp(Math.min(...dims) * 0.1, 0.007, 0.026); };
    const k = {
      B,
      rot: 0,
      frame(x, y, z, rot = 0) { F = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z); FY = y; k.rot = rot; return k; },
      world(x, y, z) { return new THREE.Vector3(x, y, z).applyMatrix4(F); },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) {
        // yaw outermost (Euler YXZ): tilt or roll a piece first, then turn it
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ')), new THREE.Vector3(sx, sy, sz)));
        const b = o.b || 'solid';
        const ink = b === 'solid' || b === 'sway' ? (o.ink === undefined ? autoInk(geo, sx, sy, sz) : o.ink) : 0;
        B[b].push({ geo, m, color, ink, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
      // a box standing on y (bottom at y), easier for walls and posts
      post(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y + h / 2, z, w, h, d, color, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, x, y + h / 2, z, r, h, r, color, o); },
      ball(x, y, z, r, color, o = {}) { return k.add(o.geo || GEO.ball, x, y, z, r, o.ry2 || r, o.rz2 || r, color, o); },
      // a beam from (x1,y1,z1) to (x2,y2,z2) in the frame, square section t
      beam(x1, y1, z1, x2, y2, z2, t, color, o = {}) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz);
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)), new THREE.Vector3(t, L, o.t2 || t)));
        const b = o.b || 'solid';
        B[b].push({ geo: o.geo || GEO.box, m, color, ink: o.ink === undefined ? clamp(t * 0.1, 0.006, 0.02) : o.ink, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
    };
    return k;
  }

  // ------------------------------------------------------------ houses
  const FLOWERS = ['#ff8fb1', '#ffd84a', '#ff6b5a', '#ffffff', '#b9a2ff', '#ff9d3a'];
  const LEAF = '#4f9a45', LEAF2 = '#5fae4f', WOOD = '#7a5236', STONE = '#b9a58a', TRIM = '#fdf8ee', GLASS = '#8fd3ec', BRICK = '#a1574a', POT = '#c46a3a';
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
  // Turn the kit to one face of a house: 0 front (+z), 1 right (+x), 2 back, 3 left. Returns { hz: distance to that wall, hw: its half-width }.
  function face(k, h, y0, i) { k.frame(h.x, y0, h.z, h.rot + [0, Math.PI / 2, Math.PI, -Math.PI / 2][i]); return i % 2 ? { hz: h.w / 2, hw: h.d / 2 } : { hz: h.d / 2, hw: h.w / 2 }; }
  // a window on the face the kit is turned to; o: { shut (closed shutters), shutter color, box (a flower box), tall, trim, R }
  function win(k, x, y, zf, o = {}) {
    const R = o.R || R0, wh = o.tall ? 1.6 : 0.95, ww = o.w || 0.86, trim = o.trim || TRIM;
    k.box(x, y, zf + 0.02, ww + 0.2, wh + 0.2, 0.08, trim, { ink: 0.009 });
    k.box(x, y, zf + 0.04, ww, wh, 0.08, GLASS, { ink: 0 });
    if (o.plain) { if (o.shut) k.box(x, y, zf + 0.1, ww + 0.04, wh + 0.04, 0.06, o.shutter, { ink: 0.01 }); return; }
    k.box(x, y, zf + 0.07, 0.06, wh, 0.05, trim, { ink: 0 }); k.box(x, y + (o.tall ? 0.25 : 0.05), zf + 0.07, ww, 0.06, 0.05, trim, { ink: 0 });
    k.box(x, y - wh / 2 - 0.12, zf + 0.1, ww + 0.36, 0.08, 0.22, trim, { ink: 0.007 });
    if (o.shut) for (const s of [-1, 1]) k.box(x + s * (ww / 4 + 0.01), y, zf + 0.12, ww / 2 + 0.02, wh + 0.04, 0.06, o.shutter, { ink: 0.01 }).box(x + s * (ww / 4 + 0.01), y + 0.15, zf + 0.16, ww / 2 - 0.1, 0.05, 0.03, shade(o.shutter, 0.8), { ink: 0 });
    else if (o.shutter) for (const s of [-1, 1]) k.box(x + s * (ww / 2 + 0.33), y, zf + 0.06, 0.42, wh + 0.04, 0.06, o.shutter, { ink: 0.01 });
    if (o.box) {
      const by = y - wh / 2 - 0.32;
      k.box(x, by, zf + 0.2, ww + 0.2, 0.24, 0.28, o.boxColor || '#a5683d');
      k.add(GEO.ico0, x, by + 0.15, zf + 0.2, ww * 0.5, 0.12, 0.15, LEAF, { ink: 0 });
      const n = 3, c0 = pick(FLOWERS, R);
      for (let i = 0; i < n; i++) k.add(GEO.ico0, x - ww / 2 + 0.16 + i * ((ww - 0.32) / (n - 1)), by + 0.24 + R() * 0.06, zf + 0.2 + (R() - 0.5) * 0.1, 0.1, 0.1, 0.1, R() < 0.7 ? c0 : pick(FLOWERS, R), { ink: 0 });
    }
  }
  // a door on the face the kit is turned to; o: { round, awning, lamp, step }
  function door(k, x, zf, color, o = {}) {
    const top = o.round ? 2.05 : 2.3;
    k.box(x, 0.35 + top / 2 + 0.06, zf + 0.02, 1.32, top + 0.14, 0.08, o.frame || TRIM);
    k.box(x, 0.35 + top / 2, zf + 0.05, 1.06, top, 0.1, color);
    if (o.round) { k.add(GEO.cyl20, x, 0.35 + top, zf + 0.05, 0.53, 0.1, 0.53, color, { rx: Math.PI / 2, ink: 0.008 }); k.add(GEO.cyl20, x, 0.35 + top, zf + 0.02, 0.66, 0.08, 0.66, o.frame || TRIM, { rx: Math.PI / 2 }); }
    k.box(x, 0.35 + top * 0.55, zf + 0.11, 0.85, 0.05, 0.03, shade(color, 0.78), { ink: 0 }).box(x, 0.35 + top * 0.25, zf + 0.11, 0.85, 0.05, 0.03, shade(color, 0.78), { ink: 0 });
    k.add(GEO.ico0, x + 0.33, 1.32, zf + 0.13, 0.06, 0.06, 0.06, '#e6b84a', { ink: 0 });
    k.box(x, 0.12, zf + 0.33, 1.5, 0.24, 0.6, STONE);
    if (o.awning) k.box(x, top + 0.75, zf + 0.42, 1.7, 0.08, 0.86, o.awning, { rx: 0.38 });
    if (o.lamp) { k.box(x + 0.92, top - 0.1, zf + 0.16, 0.22, 0.32, 0.22, '#f6e7a8', { emissive: 1 }).box(x + 0.92, top + 0.1, zf + 0.16, 0.3, 0.07, 0.3, '#2f3440').box(x + 0.92, top - 0.32, zf + 0.12, 0.05, 0.12, 0.2, '#2f3440', { ink: 0 }); }
  }
  // a gable roof with its ridge along x; returns the roof height at depth z (for chimneys)
  function gableRoof(k, w, d, H, pitch, roof, wall, o = {}) {
    const ov = 0.42, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), hR = (d / 2) * tp, t = 0.2, dark = shade(roof, 0.78);
    k.add(GEO.prism, 0, H, 0, w, hR, d, wall);
    for (const s of [-1, 1]) {
      const zm = (d / 2 + ov) / 2, ym = H + hR - zm * tp;
      k.box(0, ym + (t / 2) * cp, s * (zm + (t / 2) * sp), w + 0.7, t, (d / 2 + ov) / cp + 0.04, roof, { rx: s * pitch });
      for (let i = 1; i <= 3; i++) { const z = (i / 4) * (d / 2 + ov), y = H + hR - z * tp; k.box(0, y + (t + 0.02) * cp, s * (z + (t + 0.02) * sp), w + 0.72, 0.045, 0.13, dark, { rx: s * pitch, ink: 0 }); }
    }
    k.add(GEO.cyl8, 0, H + hR + 0.16, 0, 0.17, w + 0.82, 0.17, dark, { rz: Math.PI / 2 });
    return z => H + hR - Math.abs(z) * tp;
  }
  function hipRoof(k, w, d, H, rise, roof) {
    const ov = 0.42;
    k.add(GEO.cone4, 0, H - 0.04, 0, (w / 2 + ov) * Math.SQRT2, rise, (d / 2 + ov) * Math.SQRT2, roof);
    k.box(0, H + 0.02, 0, w + 0.86, 0.1, d + 0.86, shade(roof, 0.8), { ink: 0.012 });
    return (x, z) => H + rise * (1 - Math.max(Math.abs(x) / (w / 2 + ov), Math.abs(z) / (d / 2 + ov)));
  }
  function chimney(k, x, z, base, color, out, smoke) {
    k.post(x, base - 0.4, z, 0.62, 1.7, 0.62, color).post(x, base + 1.3, z, 0.8, 0.16, 0.8, '#5b4a46');
    if (out && smoke) out.push(k.world(x, base + 1.55, z));
  }
  // One house. h: { x, z, w, d, rot, floors, wall, roof, door, shutter, style, seed }. Smoke spots go into out.smoke.
  // o: { shutAll (Noa's closed shutters), round (door), doorSlot, shopWin (wide windows by the door), smoke (always), noChimney, lamp }
  function drawHouse(k, h, y0, out, o = {}) {
    const R = rng(Math.floor(h.seed * 1e6) + 3), two = h.floors > 1, H = two ? 5.4 : 3.05;
    const { w, d } = h, style = h.style;
    let f = face(k, h, y0, 0);
    k.post(0, -0.05, 0, w + 0.24, 0.42, d + 0.24, STONE);
    k.post(0, 0.3, 0, w, H - 0.3, d, h.wall);
    if (style === 'timber') {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2), 0.3, sz * (d / 2), 0.24, H - 0.3, 0.24, WOOD);
      for (const s of [-1, 1]) { k.box(0, H - 0.1, s * (d / 2 + 0.03), w + 0.08, 0.2, 0.1, WOOD); if (two) k.box(0, 2.72, s * (d / 2 + 0.03), w + 0.08, 0.2, 0.1, WOOD); }
      for (const s of [-1, 1]) { k.box(s * (w / 2 + 0.03), H - 0.1, 0, 0.1, 0.2, d + 0.08, WOOD); if (two) k.box(s * (w / 2 + 0.03), 2.72, 0, 0.1, 0.2, d + 0.08, WOOD); }
    } else if (style === 'stucco') {
      k.box(0, H - 0.12, 0, w + 0.1, 0.22, d + 0.1, shade(h.wall, 0.9), { ink: 0.01 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = 0.7; y < H - 0.4; y += 1.0) k.box(sx * (w / 2 - 0.12), y, sz * (d / 2 - 0.12), 0.3, 0.36, 0.3, shade(h.wall, 0.93), { ink: 0 });
    }
    // the front: a door and windows, flower boxes, shutters
    let slots = Math.max(2, Math.min(4, Math.floor((w - 0.6) / 1.6)));
    if (o.slots) slots = o.slots;
    const sx = i => -w / 2 + (w / slots) * (i + 0.5), dSlot = o.doorSlot !== undefined ? o.doorSlot : Math.floor(R() * slots);
    const shut = style !== 'timber' || o.shutAll ? h.shutter : null, boxes = R() < 0.75, rnd = o.round || (style === 'cottage' && R() < 0.6);
    for (let i = 0; i < slots; i++) {
      if (i === dSlot) door(k, sx(i), f.hz, h.door, { round: rnd, awning: o.awning !== undefined ? o.awning : R() < 0.35 ? h.shutter : null, lamp: o.lamp !== undefined ? o.lamp : R() < 0.4 });
      else win(k, sx(i), o.shopWin ? 1.55 : 1.65, f.hz, { shutter: o.shopWin ? null : shut, shut: o.shutAll, box: boxes && !o.shopWin, w: o.shopWin ? 1.45 : undefined, tall: o.shopWin, R });
      if (two) {
        if (style === 'stucco' && i === dSlot && w > 5.6 && !o.noBalcony) {
          win(k, sx(i), 3.9, f.hz, { tall: true, shutter: shut, R });
          k.box(sx(i), 2.95, f.hz + 0.4, 1.7, 0.12, 0.8, shade(h.wall, 0.85));
          for (let j = 0; j <= 6; j++) k.cyl(sx(i) - 0.8 + j * (1.6 / 6), 3.0, f.hz + 0.76, 0.025, 0.6, '#2f3440', { ink: 0, geo: GEO.cyl6 });
          for (const s of [-1, 1]) k.cyl(sx(i) + s * 0.8, 3.0, f.hz + 0.4, 0.025, 0.6, '#2f3440', { ink: 0, geo: GEO.cyl6 });
          k.box(sx(i), 3.6, f.hz + 0.76, 1.7, 0.05, 0.05, '#2f3440', { ink: 0 });
          k.cyl(sx(i) - 0.55, 3.0, f.hz + 0.45, 0.15, 0.26, POT).ball(sx(i) - 0.55, 3.38, f.hz + 0.45, 0.2, LEAF2, { geo: GEO.ball6 }).add(GEO.ico0, sx(i) - 0.5, 3.52, f.hz + 0.5, 0.08, 0.08, 0.08, pick(FLOWERS, R), { ink: 0 });
        } else win(k, sx(i), 4.0, f.hz, { shutter: shut, shut: o.shutAll, box: boxes && R() < 0.6, R });
        if (style === 'timber' && i < slots - 1) { const xa = -w / 2 + (w / slots) * (i + 1); k.beam(xa - 0.4, 2.85, f.hz + 0.03, xa + 0.4, H - 0.2, f.hz + 0.03, 0.12, WOOD, { t2: 0.06 }); k.beam(xa + 0.4, 2.85, f.hz + 0.03, xa - 0.4, H - 0.2, f.hz + 0.03, 0.12, WOOD, { t2: 0.06 }); }
      }
    }
    // the sides and the back: plainer windows
    for (const i of [1, 2, 3]) {
      const g = face(k, h, y0, i), n = Math.max(1, Math.floor((g.hw * 2 - 0.8) / 2.2));
      for (let j = 0; j < n; j++) {
        const x = -g.hw + (g.hw * 2 / n) * (j + 0.5);
        if (i === 2 || R() < 0.7) win(k, x, 1.65, g.hz, { shutter: o.shutAll ? h.shutter : i === 2 ? null : shut, shut: o.shutAll, plain: i === 2, R });
        if (two) win(k, x, 4.0, g.hz, { shutter: h.shutter, shut: o.shutAll, plain: true, R });
      }
    }
    // the roof and a chimney
    f = face(k, h, y0, 0);
    const roofStyle = style === 'stucco' && w < 7.6 ? 'hip' : 'gable';
    const cx = (R() < 0.5 ? -1 : 1) * w * 0.28, cz = -d * 0.22;
    const smoke = o.smoke || R() < 0.4;
    if (roofStyle === 'hip') { const at = hipRoof(k, w, d, H, two ? 1.7 : 1.5, h.roof); if (!o.noChimney) chimney(k, cx, cz, at(cx, cz), R() < 0.5 ? BRICK : '#efe4d6', out.smoke, smoke); }
    else { const at = gableRoof(k, w, d, H, style === 'timber' ? 0.78 : 0.6, h.roof, h.wall); if (!o.noChimney) chimney(k, cx, cz, at(cz), R() < 0.6 ? BRICK : '#c9b8a0', out.smoke, smoke); }
    h.doorAt = k.world(sx(dSlot), 0, d / 2 + 1.1);
    // little things by the door
    if (R() < 0.6) { const x = sx(dSlot) + (R() < 0.5 ? -1 : 1) * 1.05; k.cyl(x, 0.0, f.hz + 0.5, 0.24, 0.42, POT).ball(x, 0.6, f.hz + 0.5, 0.3, LEAF, { ry2: 0.26, geo: GEO.ball6 }).add(GEO.ico0, x + 0.1, 0.78, f.hz + 0.6, 0.09, 0.09, 0.09, pick(FLOWERS, R), { ink: 0 }).add(GEO.ico0, x - 0.12, 0.74, f.hz + 0.45, 0.09, 0.09, 0.09, pick(FLOWERS, R), { ink: 0 }); }
    return { H, doorX: sx(dSlot) };
  }

  // @@LANDMARKS@@
  // ------------------------------------------------------------ the special buildings
  const fenceRun = (k, out, x1, z1, x2, z2, o = {}) => {     // a picket or rail fence in the current frame; colliders in world space
    const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / (o.step || 0.42))), ry = Math.atan2(x2 - x1, z2 - z1), c = o.color || '#f4efe4';
    for (let i = 0; i <= n; i++) { const x = lerp(x1, x2, i / n), z = lerp(z1, z2, i / n); k.post(x, 0, z, o.post || 0.09, o.h || 0.62, o.post || 0.09, c, { ink: 0.008, ry }); if (!o.rail) k.add(GEO.cone4, x, o.h || 0.62, z, 0.07, 0.12, 0.07, c, { ink: 0 }); }
    for (const y of o.rails || [0.22, 0.46]) k.box((x1 + x2) / 2, y, (z1 + z2) / 2, 0.05, 0.07, L, o.railColor || c, { ink: 0.006, ry });
    if (out) for (let i = 0; i <= Math.ceil(L / 0.8); i++) { const p = k.world(lerp(x1, x2, i / Math.ceil(L / 0.8)), 0, lerp(z1, z2, i / Math.ceil(L / 0.8))); out.colliders.push({ x: p.x, z: p.z, r: 0.22 }); }
  };
  const crate = (k, x, y, z, s, ry = 0, fill) => {
    k.post(x, y, z, s, s * 0.7, s * 0.8, '#b98a55', { ry }).box(x, y + s * 0.35, z, s + 0.02, 0.06, s * 0.82, '#94683d', { ry, ink: 0 });
    if (fill) for (let i = 0; i < 6; i++) k.ball(x + Math.cos(ry) * ((i % 3) - 1) * s * 0.28 + Math.sin(ry) * ((i / 3 | 0) - 0.5) * s * 0.3, y + s * 0.72, z - Math.sin(ry) * ((i % 3) - 1) * s * 0.28 + Math.cos(ry) * ((i / 3 | 0) - 0.5) * s * 0.3, s * 0.15, typeof fill === 'string' ? fill : fill[i % fill.length], { geo: GEO.ball6, ink: 0.006 });
  };
  const barrel = (k, x, y, z, s = 1) => { k.cyl(x, y, z, 0.38 * s, 0.9 * s, '#9a6a3f', { geo: GEO.cyl8 }); for (const hy of [0.18, 0.72]) k.cyl(x, y + hy * s, z, 0.4 * s, 0.07 * s, '#4a3a33', { geo: GEO.cyl8, ink: 0 }); };
  const loaf = (k, x, y, z, s, ry = 0) => { k.ball(x, y, z, s, '#d99a4e', { ry2: s * 0.55, rz2: s * 0.6, ry, ink: 0.008 }); for (let i = -1; i <= 1; i++) k.box(x + Math.cos(ry) * i * s * 0.5, y + s * 0.5, z - Math.sin(ry) * i * s * 0.5, s * 0.08, s * 0.05, s * 0.5, '#f2d29a', { ry: ry + 0.5, ink: 0 }); };
  const bench = (k, out, x, z, ry, color = '#a8673a') => {
    k.box(x, 0.48, z, 1.7, 0.09, 0.5, color, { ry }).box(x - Math.sin(ry) * 0.24, 0.85, z - Math.cos(ry) * 0.24, 1.7, 0.4, 0.07, color, { ry, rx: -0.12 });
    for (const s of [-1, 1]) k.post(x + Math.cos(ry) * s * 0.7, 0, z - Math.sin(ry) * s * 0.7, 0.1, 0.48, 0.45, '#4a3a33', { ry });
    if (out) { const p = k.world(x, 0, z); out.colliders.push({ obox: 1, x: p.x, z: p.z, hw: 0.9, hd: 0.32, rot: ry + k.rot }); out.benches.push({ x: p.x, z: p.z, yaw: ry + k.rot }); }
  };
  function stripedAwning(k, x, y, z, w, d, cols, o = {}) {   // a striped canvas awning, sloping toward +z, with a scalloped edge
    const n = Math.max(4, Math.round(w / 0.45)), tilt = o.tilt || 0.32;
    for (let i = 0; i < n; i++) k.box(x - w / 2 + (i + 0.5) * (w / n), y, z, w / n + 0.005, 0.07, d, cols[i % 2], { rx: tilt, ink: 0.01 });
    const ey = y - Math.sin(tilt) * d / 2 - 0.04, ez = z + Math.cos(tilt) * d / 2;
    for (let i = 0; i < n; i++) k.add(GEO.cyl20, x - w / 2 + (i + 0.5) * (w / n), ey - 0.06, ez, (w / n) * 0.5, 0.05, (w / n) * 0.5, cols[i % 2], { rx: Math.PI / 2, ink: 0.008 });
  }
  function drawSpecial(k, out, gy) {
    const col = out.colliders;
    for (const b of FIXED) {
      const y0 = gy(b.x, b.z);
      if (b.kind === 'tower') { drawTower(k, b, y0, out); continue; }
      col.push({ obox: 1, x: b.x, z: b.z, hw: b.w / 2 + 0.12, hd: b.d / 2 + 0.12, rot: b.rot });
      out.frameRot = b.rot;
      const dz = b.d / 2;
      if (b.kind === 'noa') {
        drawHouse(k, { ...b, seed: 0.31, door: '#2f8f86', shutter: '#3e8f8a', style: 'cottage' }, y0, out, { shutAll: true, round: true, doorSlot: 1, awning: null, lamp: false, slots: 3 });
        k.frame(b.x, y0, b.z, b.rot);
        const dp = k.world(0, 0, dz + 0.3); LM.noaHouse = P(+dp.x.toFixed(2), +dp.z.toFixed(2));
        // the front garden, gone a little wild while Noa's away
        for (const s of [-1, 1]) { fenceRun(k, out, s * 0.75, dz + 2.4, s * 2.65, dz + 2.4); fenceRun(k, out, s * 2.65, dz + 0.25, s * 2.65, dz + 2.4); }
        const R = rng(12);
        for (let i = 0; i < 26; i++) {
          const s = i % 2 ? 1 : -1, x = s * (0.95 + R() * 1.5), z = dz + 0.45 + R() * 1.75;
          if (R() < 0.45) k.add(GEO.cone6, x, 0.25, z, 0.07, 0.5 + R() * 0.4, 0.07, R() < 0.5 ? LEAF : '#7fae4a', { ink: 0, rz: (R() - 0.5) * 0.5 });
          else k.ball(x, 0.2 + R() * 0.2, z, 0.12, R() < 0.6 ? pick(FLOWERS, R) : LEAF2, { geo: GEO.ico1, ink: 0.006 });
        }
        for (let t = 0.3; t < 2.4; t += 0.55) k.add(GEO.disc, 0, 0.03, dz + t, 0.32, 1, 0.26, '#e8e0d0', { b: 'cobble' });
        // the mailbox, stuffed full of letters
        const mx = 1.05, mz = dz + 2.85;
        k.post(mx, 0, mz, 0.1, 1.0, 0.1, WOOD).post(mx, 1.0, mz, 0.42, 0.34, 0.62, '#3e7fb0').add(GEO.cyl20, mx, 1.34, mz, 0.21, 0.62, 0.21, '#3e7fb0', { rx: Math.PI / 2 });
        k.box(mx + 0.23, 1.3, mz - 0.1, 0.03, 0.18, 0.08, '#d64b3c', { ink: 0 });
        for (let i = 0; i < 6; i++) k.box(mx + (R() - 0.5) * 0.22, 1.18 + i * 0.03, mz + 0.34 + R() * 0.05, 0.3, 0.02, 0.2, i % 3 ? '#fdf8ee' : '#f3e4c4', { ry: (R() - 0.5) * 0.8, rx: -0.3 - R() * 0.3, ink: 0.005 });
        for (let i = 0; i < 5; i++) k.box(mx + (R() - 0.3) * 1.2, 0.04, mz + 0.3 + R() * 0.7, 0.32, 0.02, 0.22, i % 2 ? '#fdf8ee' : '#f3e4c4', { ry: R() * 3, ink: 0.005 });
      } else if (b.kind === 'bakery') {
        drawHouse(k, { ...b, seed: 0.52, door: '#8d5733', shutter: '#d0663f', style: 'stucco' }, y0, out, { slots: 3, doorSlot: 1, shopWin: true, smoke: true, awning: null, lamp: true, noBalcony: true });
        k.frame(b.x, y0, b.z, b.rot);
        stripedAwning(k, 0, 2.85, dz + 0.55, b.w - 0.4, 1.2, ['#d0663f', '#fff4e4']);
        // the bread sign: a big round board and a loaf, above the awning
        k.add(GEO.cyl20, 0, 4.15, dz + 0.1, 0.95, 0.12, 0.95, '#fff4e4', { rx: Math.PI / 2 }).add(GEO.cyl20, 0, 4.15, dz + 0.06, 1.08, 0.08, 1.08, '#8d5733', { rx: Math.PI / 2 });
        loaf(k, 0, 4.15, dz + 0.36, 0.66, 0);
        for (const s of [-1, 1]) { crate(k, s * 3.1, 0, dz + 1.0, 0.8, 0.1 * s); for (let i = 0; i < 3; i++) loaf(k, s * 3.1 + (i - 1) * 0.24, 0.66, dz + 1.0, 0.16, 0.2 * i); }
        for (let i = 0; i < 4; i++) k.cyl(-1.8 + i * 0.12, 0.0, dz + 1.25, 0.05, 0.9, '#e0a85c', { rz: 0.25 - i * 0.12, geo: GEO.cyl6 });
        k.cyl(-1.8, 0, dz + 1.25, 0.3, 0.42, '#b98a55', { geo: GEO.cyl8 });
        k.post(1.85, 0, dz + 1.5, 0.7, 0.95, 0.06, '#2f3a33', { rx: 0.2 }).post(1.85, 0, dz + 1.75, 0.7, 0.95, 0.06, '#2f3a33', { rx: -0.2 });
        k.box(1.85, 0.62, dz + 1.43, 0.45, 0.04, 0.02, '#fdf8ee', { rx: 0.2, ink: 0 }).box(1.85, 0.48, dz + 1.45, 0.3, 0.04, 0.02, '#fdf8ee', { rx: 0.2, ink: 0 });
        out.colliders.push(...[[-3.1, dz + 1.0, 0.6], [3.1, dz + 1.0, 0.6], [-1.8, dz + 1.25, 0.35], [1.85, dz + 1.6, 0.4]].map(([x, z, r]) => { const p = k.world(x, 0, z); return { x: p.x, z: p.z, r }; }));
      } else if (b.kind === 'inn') {
        drawHouse(k, { ...b, seed: 0.77, door: '#8d5733', shutter: '#b84a3a', style: 'timber' }, y0, out, { slots: 5, doorSlot: 2, smoke: true, lamp: true, awning: '#b84a3a' });
        k.frame(b.x, y0, b.z, b.rot);
        // the hanging sign: a mug of something warm
        k.box(1.5, 3.25, dz + 0.65, 0.07, 0.07, 1.3, '#2f3440').beam(1.5, 2.75, dz + 0.04, 1.5, 3.22, dz + 0.6, 0.05, '#2f3440');
        k.box(1.5, 2.72, dz + 0.95, 0.08, 0.8, 0.95, '#c79d6d').box(1.5, 2.72, dz + 0.95, 0.06, 0.92, 1.07, '#8a5f3e', { ink: 0 });
        for (const s of [-1, 1]) { k.cyl(1.5 + s * 0.1, 2.48, dz + 0.95, 0.17, 0.42, '#e6a23a', { rz: s * Math.PI / 2 * 0, geo: GEO.cyl }).ball(1.5 + s * 0.1, 2.95, dz + 0.95, 0.19, '#fffaf0', { ry2: 0.1, ink: 0.006 }); }
        for (const s of [-1, 1]) k.box(1.5 + s * 0.14, 2.7, dz + 1.17, 0.05, 0.2, 0.1, '#e6a23a', { ink: 0.005 });
        // the terrace: tables with umbrellas, stools, barrels
        for (const [tx, tz, uc] of [[-2.6, 5.4, '#b84a3a'], [2.6, 5.6, '#3f7fc9']]) {
          k.cyl(tx, 0, tz, 0.08, 0.75, '#4a3a33').cyl(tx, 0.75, tz, 0.62, 0.07, '#c79d6d', { geo: GEO.cyl20 }).cyl(tx, 0, tz, 0.3, 0.05, '#4a3a33');
          k.cyl(tx, 0.82, tz, 0.035, 1.9, '#4a3a33', { geo: GEO.cyl6 }).add(GEO.cone, tx, 2.55, tz, 1.35, 0.5, 1.35, uc).add(GEO.cone, tx, 2.555, tz, 1.38, 0.08, 1.38, '#fff4e4', { ink: 0 });
          for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; k.cyl(tx + Math.cos(a) * 0.95, 0, tz + Math.sin(a) * 0.95, 0.24, 0.46, '#a8673a', { geo: GEO.cyl8 }); }
          k.cyl(tx + 0.2, 0.82, tz, 0.07, 0.16, '#e6a23a', { ink: 0.005 }).cyl(tx - 0.25, 0.82, tz + 0.15, 0.07, 0.16, '#e6a23a', { ink: 0.005 });
          const p = k.world(tx, 0, tz); col.push({ x: p.x, z: p.z, r: 0.75 });
        }
        for (const [x, z] of [[-4.4, dz + 0.55], [-3.6, dz + 0.5], [4.3, dz + 0.55]]) { barrel(k, x, 0, z); const p = k.world(x, 0, z); col.push({ x: p.x, z: p.z, r: 0.42 }); }
        barrel(k, -4.0, 0.9, dz + 0.52, 0.8);
        for (const x of [-4.6, 4.6]) k.box(x, 0.25, 7.6, 0.9, 0.5, 0.5, '#a5683d').ball(x, 0.62, 7.6, 0.42, LEAF, { ry2: 0.24, geo: GEO.ball6 }).add(GEO.ico0, x + 0.2, 0.8, 7.6, 0.1, 0.1, 0.1, '#ff8fb1', { ink: 0 }).add(GEO.ico0, x - 0.2, 0.78, 7.7, 0.1, 0.1, 0.1, '#ffd84a', { ink: 0 });
      } else if (b.kind === 'school') {
        drawHouse(k, { ...b, seed: 0.13, door: '#c98a2e', shutter: '#3e7fb0', style: 'cottage' }, y0, out, { slots: 5, doorSlot: 2, lamp: false, awning: '#3e7fb0', noChimney: true });
        k.frame(b.x, y0, b.z, b.rot);
        // a little bell turret on the ridge, and a sign with an open book
        const ry0 = 3.05 + dz * Math.tan(0.6);
        k.post(0, ry0 - 0.5, 0, 1.0, 1.4, 1.0, '#f9f1e1').box(0, ry0 + 0.55, 0.51, 0.5, 0.6, 0.04, '#3a3040', { ink: 0 }).box(0, ry0 + 0.55, -0.51, 0.5, 0.6, 0.04, '#3a3040', { ink: 0 });
        k.add(GEO.cone4, 0, ry0 + 0.9, 0, 0.85, 0.9, 0.85, '#4f9a5a').ball(0, ry0 + 1.85, 0, 0.1, '#e6b84a', { ink: 0.006 });
        k.add(GEO.half, 0, ry0 + 0.32, 0, 0.18, 0.26, 0.18, '#e6b84a', { ink: 0.008, rx: Math.PI });
        k.box(0, 3.05 + 0.02, dz + 0.1, 1.6, 0.7, 0.1, '#3e7fb0');
        for (const s of [-1, 1]) k.box(s * 0.3, 3.1, dz + 0.22, 0.58, 0.42, 0.04, '#fffaf0', { ry: -s * 0.35, ink: 0.006 });
        // hopscotch chalked on the ground
        const hop = [[0, 1], [0, 2], [-0.5, 3], [0.5, 3], [0, 4], [-0.5, 5], [0.5, 5], [0, 6]];
        hop.forEach(([x, i], j) => k.box(-2.6 + i * 0.62, 0.035, dz + 1.6 + x * 1.2, 0.56, 0.01, 0.56, ['#ffd84a', '#ff8fb1', '#8fd3ec', '#b9a2ff'][j % 4], { b: 'cobble' }));
        bench(k, out, 3.0, dz + 1.3, Math.PI, '#3e7fb0');
      }
    }
  }
  function drawTower(k, b, y0, out) {
    k.frame(b.x, y0, b.z, 0);
    const W = b.w, stone = '#efe4d0', q = '#d6c6a8';
    k.post(0, -0.05, 0, W + 0.5, 0.55, W + 0.5, STONE).post(0, 0.45, 0, W, 8.0, W, stone);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = 0.7; y < 8.2; y += 0.9) k.box(sx * (W / 2 - 0.15), y + ((y * 10 | 0) % 2) * 0.1, sz * (W / 2 - 0.15), 0.42, 0.4, 0.42, q, { ink: 0 });
    k.box(0, 8.55, 0, W + 0.55, 0.28, W + 0.55, q).box(0, 4.8, 0, W + 0.2, 0.16, W + 0.2, q);
    door(k, 0, W / 2, '#8d5733', { round: true });
    // the clock
    k.add(GEO.cyl20, 0, 6.6, W / 2 + 0.05, 0.98, 0.06, 0.98, '#3a5a7a', { rx: Math.PI / 2 }).add(GEO.cyl20, 0, 6.6, W / 2 + 0.09, 0.82, 0.06, 0.82, '#fdf8ee', { rx: Math.PI / 2 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.box(Math.sin(a) * 0.68, 6.6 + Math.cos(a) * 0.68, W / 2 + 0.13, 0.05, i % 3 ? 0.08 : 0.16, 0.02, '#2b2235', { rz: -a, ink: 0 }); }
    k.box(0, 6.82, W / 2 + 0.15, 0.07, 0.48, 0.02, '#2b2235', { ink: 0 }).box(0.17, 6.6, W / 2 + 0.15, 0.36, 0.06, 0.02, '#2b2235', { ink: 0 }).ball(0, 6.6, W / 2 + 0.15, 0.06, '#2b2235', { ink: 0 });
    for (const s of [-1, 1]) k.box(s * (W / 2 + 0.02), 4.0, 0, 0.06, 0.9, 0.38, '#3a3040', { ink: 0.008 });
    // the belfry: four pillars, arches, the bell (hung later, so it can swing)
    k.box(0, 8.75, 0, W - 0.1, 0.12, W - 0.1, '#8a6a4a');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (W / 2 - 0.3), 8.7, sz * (W / 2 - 0.3), 0.6, 2.6, 0.6, stone);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; k.add(GEO.arch, Math.sin(a) * (W / 2 - 0.3), 10.15, Math.cos(a) * (W / 2 - 0.3), 1.2, 1.0, 1.4, stone, { ry: a }); k.box(Math.sin(a) * (W / 2 - 0.3), 9.15, Math.cos(a) * (W / 2 - 0.3), Math.abs(Math.cos(a)) * 2.4 + 0.12, 0.1, Math.abs(Math.sin(a)) * 2.4 + 0.12, q, { ink: 0.008 }); }
    k.box(0, 11.45, 0, W + 0.5, 0.3, W + 0.5, q);
    k.add(GEO.cone4, 0, 11.55, 0, (W / 2 + 0.4) * Math.SQRT2, 3.4, (W / 2 + 0.4) * Math.SQRT2, '#c9553f');
    k.cyl(0, 14.8, 0, 0.04, 1.1, '#2f3440', { geo: GEO.cyl6 }).ball(0, 15.0, 0, 0.13, '#e6b84a').box(0, 15.55, 0, 0.9, 0.06, 0.05, '#2f3440', { ink: 0 }).add(GEO.cone4, 0.48, 15.52, 0, 0.12, 0.2, 0.05, '#2f3440', { rz: -Math.PI / 2, ink: 0 });
    out.colliders.push({ obox: 1, x: b.x, z: b.z, hw: W / 2 + 0.3, hd: W / 2 + 0.3, rot: 0 });
    out.bellAt = k.world(0, 10.75, 0);
  }

  function drawLandmarks(k, out, gy) {
    out.benches = out.benches || [];
    drawSpecial(k, out, gy);
    drawGates(k, out, gy); drawFountain(k, out); drawRosa(k, out); drawStalls(k, out); drawYard(k, out); drawPond(k, out);
    drawProps(k, out);
  }
  // ------------------------------------------------------------ trees, lamps, benches, bunting, laundry, planters, odds and ends
  const TREES = {
    round(k, s, R) { k.cyl(0, 0, 0, 0.2 * s, 2.3 * s, '#8a5f3e', { b: 'sway', geo: GEO.cyl8 }); [[0, 2.9, 0, 1.15], [0.85, 2.55, 0.3, 0.85], [-0.8, 2.6, -0.2, 0.9], [0.15, 3.55, -0.25, 0.8], [-0.25, 2.5, 0.8, 0.78], [0.35, 2.55, -0.8, 0.78]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#4b973f'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 1.4 * s, y1: 4 * s, k: 1 } })); },
    apple(k, s, R) { TREES.round(k, s, R); for (let i = 0; i < 14; i++) { const a = R() * TAU, y = 2.2 + R() * 1.5, r = 1.0 + R() * 0.25; k.ball(Math.cos(a) * r * s, y * s, Math.sin(a) * r * s, 0.12 * s, R() < 0.8 ? '#e2453a' : '#f2c14e', { b: 'sway', geo: GEO.ball6, ink: 0.006, sway: { y0: 1.4 * s, y1: 4 * s, k: 1 } }); } },
    big(k, s, R) { k.cyl(0, 0, 0, 0.42 * s, 3.0 * s, '#7c5436', { b: 'sway', geo: GEO.cyl8 }); [[0, 4.0, 0, 1.8], [1.45, 3.5, 0.4, 1.35], [-1.35, 3.6, -0.3, 1.45], [0.3, 5.0, -0.4, 1.25], [-0.5, 3.5, 1.25, 1.25], [0.6, 3.6, -1.25, 1.25]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, ['#4a9440', '#55a346', '#4f9c3f', '#62b04c', '#4b973f', '#5aa84a'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 2 * s, y1: 5.5 * s, k: 0.8 } })); },
    cypress(k, s, R) { k.cyl(0, 0, 0, 0.14 * s, 0.8 * s, '#7c5436', { b: 'sway', geo: GEO.cyl6 }); k.ball(0, 2.3 * s, 0, 0.75 * s, '#3f7f45', { b: 'sway', ry2: 2.0 * s, geo: GEO.ico1, sway: { y0: 0.8 * s, y1: 4.2 * s, k: 0.6 } }); k.ball(0.1 * s, 3.6 * s, 0, 0.45 * s, '#4a8a4e', { b: 'sway', ry2: 1.0 * s, geo: GEO.ico1, sway: { y0: 0.8 * s, y1: 4.2 * s, k: 0.6 } }); },
    birch(k, s, R) { k.cyl(0, 0, 0, 0.13 * s, 3.2 * s, '#efe9dc', { b: 'sway', geo: GEO.cyl8 }); for (let i = 0; i < 4; i++) k.box(0, (0.5 + i * 0.7) * s, 0.13 * s, 0.2 * s, 0.05 * s, 0.03, '#3a3040', { b: 'sway', ink: 0 }); [[0, 3.4, 0, 0.85], [0.5, 2.9, 0.3, 0.68], [-0.5, 3.0, -0.2, 0.72], [0.1, 4.0, -0.2, 0.62]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, ['#8fc45a', '#9dcc63', '#86bb52', '#a7d36d'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 1.8 * s, y1: 4.4 * s, k: 1 } })); },
    bush(k, s, R) { for (let i = 0; i < 3; i++) k.ball((i - 1) * 0.42 * s, 0.38 * s, (R() - 0.5) * 0.3 * s, (0.45 + R() * 0.12) * s, ['#4f9c3f', '#5aa84a', '#469240'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 0.2, y1: 1.2 * s, k: 0.25 } }); if (R() < 0.6) for (let i = 0; i < 4; i++) k.add(GEO.ico0, (R() - 0.5) * 1.1 * s, (0.6 + R() * 0.25) * s, (R() - 0.5) * 0.5 * s, 0.09, 0.09, 0.09, pick(FLOWERS, R), { b: 'sway', ink: 0 }); },
    willow(k, s, R) { k.cyl(0, 0, 0, 0.3 * s, 2.6 * s, '#7c5436', { b: 'sway', geo: GEO.cyl8 }); k.ball(0, 3.2 * s, 0, 1.5 * s, '#7dbb55', { b: 'sway', ry2: 1.0 * s, geo: GEO.ico1, sway: { y0: 1.5, y1: 4.5 * s, k: 0.7 } }); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; k.add(GEO.cone6, Math.cos(a) * 1.25 * s, 2.0 * s, Math.sin(a) * 1.25 * s, 0.45 * s, 2.2 * s, 0.45 * s, i % 2 ? '#86c25e' : '#74b04e', { b: 'sway', rx: Math.PI, sway: { y0: 3.0 * s, y1: 0.9 * s, k: 1.1 } }); } },
  };
  function freeSpot(x, z, r, o = {}) {
    if (Math.hypot(x - CEN.x, z - CEN.z) > (o.maxR || 41)) return false;
    if (streetDist(x, z) < (o.street !== undefined ? o.street : r + 0.3)) return false;
    if (pavedAt(x, z) > 0.05 && !o.paved) return false;
    for (const b of FIXED.concat(HOUSES)) if (circleHitsObb({ x, z, r: r + (o.house !== undefined ? o.house : 0.6) }, { x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot })) return false;
    for (const q of RESERVED) if (q.c ? Math.hypot(x - q.x, z - q.z) < q.r + r : circleHitsObb({ x, z, r }, q)) return false;
    for (const c of o.avoid || []) if (Math.hypot(x - c.x, z - c.z) < (c.r || 0) + r) return false;
    return true;
  }
  function tree(k, out, kind, x, z, s, R, colR) { k.frame(x, GY, z, R() * TAU); TREES[kind](k, s, R); if (colR !== 0) out.colliders.push({ x, z, r: colR || (kind === 'big' ? 0.75 * s : kind === 'bush' ? 0.7 * s : 0.42 * s) }); out.trees.push({ x, z, r: kind === 'bush' ? 1.0 : 1.4 }); }
  function bunting(k, x1, y1, z1, x2, y2, z2, sag, R) {
    const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(3, Math.round(L / 0.5)), ry = Math.atan2(x2 - x1, z2 - z1);
    const P = t => [lerp(x1, x2, t), lerp(y1, y2, t) - sag * 4 * t * (1 - t), lerp(z1, z2, t)];
    for (let i = 0; i < 8; i++) { const a = P(i / 8), b = P((i + 1) / 8); k.beam(a[0], a[1], a[2], b[0], b[1], b[2], 0.018, '#4a3a33', { ink: 0, geo: GEO.cyl6 }); }
    const cols = ['#e0503f', '#f2c14e', '#3f7fc9', '#4f9a5a', '#fff4e4', '#e86a9a'], c0 = (R() * 6) | 0;
    for (let i = 1; i < n; i++) { const [x, y, z] = P(i / n); k.add(GEO.prism, x, y, z, 0.02, 0.32, 0.27, cols[(c0 + i) % 6], { b: 'sway', ry, rz: Math.PI, ink: 0.004, sway: { y0: y - 0.02, y1: y - 0.34, k: 0.9 } }); }
  }
  function lamp(k, out, x, z) {
    k.frame(x, GY, z, 0);
    k.cyl(0, 0, 0, 0.17, 0.3, '#2f3440', { geo: GEO.cyl8 }).cyl(0, 0.3, 0, 0.065, 2.75, '#2f3440', { geo: GEO.cyl6 }).cyl(0, 2.2, 0, 0.11, 0.1, '#2f3440', { geo: GEO.cyl8, ink: 0 });
    lantern(k, 0, 3.25, 0);
    out.colliders.push({ x, z, r: 0.2 }); out.lamps.push({ x, z, top: GY + 3.1 });
  }
  function laundry(k, out, x1, z1, x2, z2, R) {
    const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1);
    k.frame(x1, GY, z1, ry);
    for (const z of [0, L]) { k.cyl(0, 0, z, 0.06, 2.35, '#8a5f3e', { geo: GEO.cyl6 }).box(0, 2.3, z, 0.6, 0.07, 0.07, '#8a5f3e'); out.colliders.push({ ...(() => { const p = k.world(0, 0, z); return { x: p.x, z: p.z }; })(), r: 0.18 }); }
    k.beam(0, 2.25, 0, 0, 2.15, L / 2, 0.015, '#f4efe4', { ink: 0, geo: GEO.cyl6 }).beam(0, 2.15, L / 2, 0, 2.25, L, 0.015, '#f4efe4', { ink: 0, geo: GEO.cyl6 });
    const cols = ['#fdf8ee', '#8fd3ec', '#ff8fb1', '#f6d36a', '#b9d98a', '#e0503f', '#b9a2ff'];
    for (let z = 0.45; z < L - 0.4;) {
      const kind = R(), c = pick(cols, R), y = 2.18 - Math.sin((z / L) * Math.PI) * 0.1;
      const sw = { y0: y, y1: y - 1.0, k: 0.8 };
      if (kind < 0.35) { k.box(0, y - 0.3, z + 0.3, 0.03, 0.55, 0.5, c, { b: 'sway', sway: sw }).box(0, y - 0.12, z + 0.3, 0.03, 0.18, 0.86, c, { b: 'sway', sway: sw }); z += 0.75; }
      else if (kind < 0.6) { k.box(0, y - 0.4, z + 0.45, 0.025, 0.78, 0.9, c, { b: 'sway', sway: sw }); z += 1.05; }
      else if (kind < 0.8) { for (const s of [-1, 1]) k.box(0, y - 0.32, z + 0.22 + s * 0.1, 0.03, 0.62, 0.16, c, { b: 'sway', sway: sw }); k.box(0, y - 0.04, z + 0.22, 0.03, 0.1, 0.38, c, { b: 'sway', sway: sw }); z += 0.6; }
      else { k.box(0, y - 0.12, z + 0.08, 0.03, 0.22, 0.08, c, { b: 'sway', sway: sw }).box(0, y - 0.12, z + 0.28, 0.03, 0.22, 0.08, pick(cols, R), { b: 'sway', sway: sw }); z += 0.45; }
    }
    out.laundry.push({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry });
  }
  function drawProps(k, out) {
    out.trees = []; out.lamps = []; out.laundry = []; out.cats = [];
    const R = rng(2024), C = PLAZA;
    // the plaza: lamps all round, benches facing the fountain, two big shade trees with round benches, planters, a signpost
    const ring = (a, r) => [C.x + Math.cos(a * Math.PI / 180) * r, C.z + Math.sin(a * Math.PI / 180) * r];
    for (const a of [22, 68, 112, 158, 202, 248, 292, 338]) lamp(k, out, ...ring(a, 12.6));
    for (const a of [20, 65, 112, 160, 200, 250, 290, 340]) { const [x, z] = ring(a, 9.4); k.frame(0, GY, 0, 0); bench(k, out, x, z, Math.atan2(C.x - x, C.z - z)); }
    for (const a of [135, 315]) {
      const [x, z] = ring(a, 8.4); tree(k, out, 'big', x, z, 1.05, R, 0.6);
      k.frame(x, GY, z, 0);
      for (let i = 0; i < 8; i++) { const b = (i / 8) * TAU; k.box(Math.sin(b) * 1.15, 0.46, Math.cos(b) * 1.15, 0.92, 0.09, 0.45, '#a8673a', { ry: b }).post(Math.sin(b) * 1.15, 0, Math.cos(b) * 1.15, 0.12, 0.44, 0.12, '#4a3a33'); }
      out.colliders.push({ x, z, r: 1.45 }); out.roundBench = out.roundBench || []; out.roundBench.push({ x, z });
    }
    for (const a of [45, 225]) { const [x, z] = ring(a, 10.9); k.frame(x, GY, z, 0); k.cyl(0, 0, 0, 0.75, 0.55, '#ddd3c1', { geo: GEO.cyl20 }).cyl(0, 0.5, 0, 0.66, 0.08, '#6b4a33', { geo: GEO.cyl20, ink: 0 }).ball(0, 0.68, 0, 0.55, LEAF, { ry2: 0.32, geo: GEO.ball6 }); for (let i = 0; i < 9; i++) k.add(GEO.ico0, (R() - 0.5) * 0.9, 0.85 + R() * 0.15, (R() - 0.5) * 0.9, 0.1, 0.1, 0.1, pick(FLOWERS, R), { ink: 0 }); out.colliders.push({ x, z, r: 0.85 }); }
    {
      // the signpost: four big arms pointing the way, each in its place's color with an arrow tip; the names and their
      // little pictures are painted on both faces in build() (the language can change), from out.signpost
      const [x, z] = ring(250, 5.2), ARM = { len: 1.6, h: 0.42, t: 0.07 }; k.frame(x, GY, z, 0.3);
      k.cyl(0, 0, 0, 0.09, 3.0, '#8a5f3e', { geo: GEO.cyl8 }).ball(0, 3.02, 0, 0.11, '#8a5f3e');
      out.signpost = { x, z, ...ARM, arms: [] };
      const signs = [['bakery', LM.bakery, '#d0663f', 'bread'], ['bell', LM.bellTower, '#3e7fb0', 'bell'], ['stall', LM.stall, '#e0503f', 'apple'], ['gate', LM.eastGate, '#4f9a5a', 'gate']];
      signs.forEach(([key, p, c, icon], i) => {
        const A = Math.atan2(p.x - x, p.z - z), a = A - 0.3, y = 2.6 - i * 0.5, mid = ARM.len / 2 + 0.05, tip = ARM.len + 0.17;
        k.box(Math.sin(a) * mid, y, Math.cos(a) * mid, ARM.t, ARM.h, ARM.len, c, { ry: a })
          .add(GEO.cone4, Math.sin(a) * tip, y, Math.cos(a) * tip, 0.05, 0.32, 0.28, c, { ry: a, rx: Math.PI / 2, ink: 0.006 });
        out.signpost.arms.push({ key, A, y, color: c, icon });
      });
      out.colliders.push({ x, z, r: 0.2 });
    }
    // streets: lamps every so often, bunting across the market street and the top of the main street
    for (const s of STREETS) {
      if (s.lane) continue;
      let side = 1, acc = 6;
      for (let i = 0; i < s.pts.length - 1; i++) {
        const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
        for (let t = acc; t < L; t += 10.5) {
          const x = ax + ux * t - uz * side * (s.w / 2 + 0.55), z = az + uz * t + ux * side * (s.w / 2 + 0.55);
          if (Math.hypot(x - C.x, z - C.z) > C.r + 2 && freeSpot(x, z, 0.3, { street: 0.2, house: 0.3, paved: true })) lamp(k, out, x, z);
          side = -side; acc = t + 10.5 - L;
        }
      }
    }
    k.frame(0, GY, 0, 0);
    for (const x of [6.4, 12.0, 17.4, 23.2]) { const zc = eastZ(x); k.cyl(x, 0, zc + 2.85, 0.06, 3.7, '#8a5f3e', { geo: GEO.cyl6 }).cyl(x + 2.6, 0, zc - 2.85, 0.06, 3.7, '#8a5f3e', { geo: GEO.cyl6 }); out.colliders.push({ x, z: zc + 2.85, r: 0.15 }, { x: x + 2.6, z: zc - 2.85, r: 0.15 }); bunting(k, x, 3.6, zc + 2.85, x + 2.6, 3.6, zc - 2.85, 0.35, R); if (x < 20) bunting(k, x + 2.6, 3.6, zc - 2.85, x + 5.6, 3.6, eastZ(x + 5.6) + 2.85, 0.35, R); }
    const pl = out.lamps.filter(l => Math.hypot(l.x - C.x, l.z - C.z) < 13.5);
    for (let i = 0; i < pl.length; i += 2) { const a = pl[i], b = pl[(i + 1) % pl.length]; bunting(k, a.x, 3.05, a.z, b.x, 3.05, b.z, 0.5, R); }
    // cats: one asleep on the gate's sunny wall, one on the fountain's rim watching the water
    out.cats.push({ x: LM.gate.x - 4.0, y: GY + 1.02, z: LM.gate.z - 0.05, yaw: 1.2, sleep: true });
    { const a = 200 * Math.PI / 180; out.cats.push({ x: LM.fountain.x + Math.cos(a) * 2.68, y: GY + 0.63, z: LM.fountain.z + Math.sin(a) * 2.68, yaw: Math.atan2(-Math.cos(a), -Math.sin(a)), sleep: false }); }
    // trees: Rosa's apple tree, the pond's willow, and trees and shrubs in the gardens
    tree(k, out, 'apple', LM.appleTree.x, LM.appleTree.z, 0.95, R, 0.45);
    tree(k, out, 'willow', 15.6, -174.2, 1.0, R, 0.4);
    const avoid = () => out.trees.concat(out.lamps.map(l => ({ x: l.x, z: l.z, r: 0.6 })));
    for (let n = 0, placed = 0; n < 3000 && placed < 22; n++) {
      const a = R() * TAU, r = 10 + Math.sqrt(R()) * 31, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r;
      const kind = R() < 0.3 ? 'bush' : pick(['round', 'round', 'cypress', 'birch', 'round', 'apple'], R), s = 0.75 + R() * 0.35;
      const rr = kind === 'bush' ? 0.9 : 1.6;
      if (!freeSpot(x, z, rr, { avoid: avoid().map(t => ({ x: t.x, z: t.z, r: (t.r || 1) + 1.2 })), house: kind === 'bush' ? 0.1 : 0.5 })) continue;
      tree(k, out, kind, x, z, s, R); placed++;
    }
    // a few trees just outside town, framing it
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU + R() * 0.3, r = 45 + R() * 6, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r; if (Math.abs(x - LM.gate.x) < 7 && z > -112) continue; if (Math.abs(z - LM.eastGate.z) < 7 && x > 25) continue; if (Math.abs(x - LM.northGate.x) < 6 && z < -185) continue; if (Math.abs(z - LM.westGate.z) < 6 && x < -40) continue; tree(k, out, R() < 0.3 ? 'cypress' : 'round', x, z, 1 + R() * 0.3, R); }
    // laundry lines in back gardens
    for (let n = 0; n < 4000 && out.laundry.length < 3; n++) {
      const a = R() * TAU, r = 18 + R() * 20, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r, ang = R() * Math.PI, x2 = x + Math.sin(ang) * 4.2, z2 = z + Math.cos(ang) * 4.2;
      const av = { avoid: avoid().map(t => ({ x: t.x, z: t.z, r: (t.r || 1) + 0.6 })).concat(out.laundry.map(l => ({ x: l.x, z: l.z, r: 12 }))), house: 0.2 };
      if (!freeSpot(x, z, 1.0, av) || !freeSpot(x2, z2, 1.0, av) || !freeSpot((x + x2) / 2, (z + z2) / 2, 1.2, av)) continue;
      laundry(k, out, x, z, x2, z2, R);
    }
    // odds and ends by the houses: barrels, crates, firewood, flower pots
    for (const h of HOUSES) {
      const r2 = rng(Math.floor(h.seed * 9e5) + 11);
      const side = r2() < 0.5 ? -1 : 1, lx = side * (h.w / 2 + 0.55), lz = (r2() - 0.5) * (h.d - 1.4);
      const p = { x: h.x + lx * Math.cos(h.rot) + lz * Math.sin(h.rot), z: h.z - lx * Math.sin(h.rot) + lz * Math.cos(h.rot) };
      if (!freeSpot(p.x, p.z, 0.45, { house: -0.05, street: 0.4 })) continue;
      k.frame(p.x, GY, p.z, h.rot);
      const kind = r2();
      if (kind < 0.3) { barrel(k, 0, 0, 0); out.colliders.push({ x: p.x, z: p.z, r: 0.42 }); }
      else if (kind < 0.55) { crate(k, 0, 0, 0, 0.75, r2(), r2() < 0.5 ? ['#e2453a', '#f2c14e', '#9cc24e'] : null); out.colliders.push({ x: p.x, z: p.z, r: 0.45 }); }
      else if (kind < 0.8) { for (let i = 0; i < 9; i++) k.cyl(0, 0.15 + (i % 3) * 0.26, -0.5 + (i / 3 | 0) * 0.5, 0.13, 0.5, '#b07a48', { rz: Math.PI / 2, geo: GEO.cyl6, ink: 0.006 }); out.colliders.push({ obox: 1, x: p.x, z: p.z, hw: 0.4, hd: 0.8, rot: h.rot }); }
      else { k.cyl(0, 0, 0, 0.26, 0.45, POT).ball(0, 0.62, 0, 0.32, LEAF2, { geo: GEO.ball6 }).add(GEO.ico0, 0.1, 0.85, 0.1, 0.1, 0.1, 0.1, pick(FLOWERS, r2), { ink: 0 }); out.colliders.push({ x: p.x, z: p.z, r: 0.32 }); }
    }
  }
  const worldCol = (k, out, x, z, r) => { const p = k.world(x, 0, z); out.colliders.push({ x: p.x, z: p.z, r }); };
  const worldBox = (k, out, x, z, hw, hd, ry = 0) => { const p = k.world(x, 0, z); out.colliders.push({ obox: 1, x: p.x, z: p.z, hw, hd, rot: k.rot + ry }); };
  function lantern(k, x, y, z) { k.box(x, y, z, 0.26, 0.34, 0.26, '#fff3b0', { ink: 0.008 }).box(x, y + 0.21, z, 0.36, 0.08, 0.36, '#2f3440').add(GEO.cone4, x, y + 0.24, z, 0.22, 0.16, 0.22, '#2f3440', { ink: 0 }).box(x, y - 0.2, z, 0.3, 0.06, 0.3, '#2f3440', { ink: 0 }); }
  function drawGates(k, out, gy) {
    // the south gate: stone pillars with lanterns, a wooden arch with a flower garland, and the town's name (hung in build())
    k.frame(LM.gate.x, gy(LM.gate.x, LM.gate.z), LM.gate.z, 0);
    for (const s of [-1, 1]) {
      k.post(s * 2.4, -0.05, 0, 0.8, 3.75, 0.8, '#d9cdb6').post(s * 2.4, 3.7, 0, 1.0, 0.22, 1.0, '#c9b89a').ball(s * 2.4, 4.12, 0, 0.22, '#c9b89a');
      for (let y = 0.5; y < 3.5; y += 0.75) k.box(s * 2.4, y, 0, 0.84, 0.06, 0.84, '#c9b89a', { ink: 0 });
      lantern(k, s * 2.95, 2.55, 0); k.box(s * 2.75, 2.85, 0, 0.32, 0.05, 0.05, '#2f3440', { ink: 0 });
      // low walls running out to the sides
      k.post(s * 4.5, -0.05, 0.1, 3.4, 0.95, 0.7, '#d9cdb6').box(s * 4.5, 0.95, 0.1, 3.5, 0.14, 0.82, '#c9b89a');
      worldBox(k, out, s * 2.4, 0, 0.45, 0.45); worldBox(k, out, s * 4.5, 0.1, 1.75, 0.4);
    }
    const arc = [];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; arc.push([-Math.cos(a) * 2.4, 3.95 + Math.sin(a) * 1.15]); }
    for (let i = 0; i < arc.length - 1; i++) k.beam(arc[i][0], arc[i][1], 0, arc[i + 1][0], arc[i + 1][1], 0, 0.3, '#8a5f3e', { t2: 0.42 });
    const R = rng(5);
    for (let i = 1; i < arc.length - 1; i++) { k.ball(arc[i][0], arc[i][1] + 0.18, 0.12, 0.2, LEAF, { geo: GEO.ball6, ink: 0.006 }); if (i % 2) k.add(GEO.ico0, arc[i][0] + 0.1, arc[i][1] + 0.3, 0.26, 0.1, 0.1, 0.1, pick(['#ff8fb1', '#ffd84a', '#ffffff'], R), { ink: 0 }); }
    for (const s of [-1, 1]) k.beam(s * 1.6, 4.85, 0.05, s * 1.35, 4.4, 0.05, 0.035, '#2f3440', { ink: 0 });
    out.gateSign = { at: k.world(0, 4.05, 0), rot: 0 };
    // the east gate: a wooden arch out to the fields, with a sheaf of wheat on top
    k.frame(LM.eastGate.x, gy(LM.eastGate.x, LM.eastGate.z), LM.eastGate.z, Math.PI / 2);
    for (const s of [-1, 1]) { k.post(s * 2.6, 0, 0, 0.36, 3.4, 0.36, '#8a5f3e').ball(s * 2.6, 3.5, 0, 0.2, '#8a5f3e'); worldBox(k, out, s * 2.6, 0, 0.25, 0.25); fenceRun(k, out, s * 2.8, 0, s * 6.2, -0.6, { rail: 1, color: '#c79d6d', post: 0.12, h: 0.9, rails: [0.35, 0.72], step: 1.1 }); }
    k.box(0, 3.15, 0, 5.8, 0.3, 0.36, '#8a5f3e').box(0, 2.85, 0, 5.4, 0.12, 0.3, '#a8784e', { ink: 0 });
    for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.13; k.beam(0, 3.25, 0, Math.sin(a) * 0.9, 3.25 + Math.cos(a) * 0.9, 0, 0.05, '#d9b85a', { ink: 0 }).ball(Math.sin(a) * 0.95, 3.25 + Math.cos(a) * 0.95, 0, 0.09, '#e8c46a', { ry2: 0.16, geo: GEO.ball6, ink: 0.005 }); }
    k.box(0, 3.55, 0, 0.5, 0.1, 0.3, '#c9553f', { ink: 0.006 });
    // the west and north ways out: a pair of stone markers each
    for (const [p, rot] of [[LM.westGate, Math.PI / 2], [LM.northGate, 0]]) {
      k.frame(p.x, gy(p.x, p.z), p.z, rot);
      for (const s of [-1, 1]) { k.post(s * 3.0, 0, 0, 0.6, 1.3, 0.6, '#d9cdb6').ball(s * 3.0, 1.45, 0, 0.26, '#c9b89a'); worldBox(k, out, s * 3.0, 0, 0.32, 0.32); }
    }
  }
  const FLAT = (() => { const g = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true); return g; })();
  function drawFountain(k, out) {
    const F = LM.fountain; k.frame(F.x, GY, F.z, 0);
    const basin = new THREE.LatheGeometry([[2.35, 0], [2.9, 0], [2.95, 0.48], [2.8, 0.62], [2.5, 0.62], [2.38, 0.5], [2.35, 0.3]].map(([x, y]) => new THREE.Vector2(x, y)), 32);
    k.add(basin, 0, 0, 0, 1, 1, 1, '#ddd3c1', { ink: 0.022 });
    k.add(GEO.disc64, 0, 0.44, 0, 2.38, 1, 2.38, '#5fb8d6', { b: 'water' });
    k.cyl(0, 0.3, 0, 0.5, 1.0, '#d3c8b4', { geo: GEO.cyl20 });
    const bowl = new THREE.LatheGeometry([[0.2, 1.15], [0.95, 1.22], [1.25, 1.48], [1.16, 1.56], [0.95, 1.45], [0.2, 1.4]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    k.add(bowl, 0, 0, 0, 1, 1, 1, '#ddd3c1', { ink: 0.016 }).add(GEO.disc, 0, 1.47, 0, 1.0, 1, 1.0, '#7cc8e0', { b: 'water' });
    k.cyl(0, 1.4, 0, 0.17, 0.75, '#d3c8b4', { geo: GEO.cyl20 }).add(GEO.half, 0, 2.15, 0, 0.42, 0.18, 0.42, '#ddd3c1', { rx: Math.PI }).ball(0, 2.22, 0, 0.16, '#d3c8b4');
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; k.ball(Math.sin(a) * 2.62, 0.7, Math.cos(a) * 2.62, 0.16, '#c9b89a'); }
    out.colliders.push({ x: F.x, z: F.z, r: 3.05 });
    out.fountainAt = { x: F.x, y: GY, z: F.z };
  }
  // A market stall in the current frame (front = +z). goods: apples, veg, flowers, cheese, pots, fish, bread
  function stall(k, out, goods, awn, o = {}) {
    const wood = o.gray ? '#a9a6a2' : '#b07a48', woodD = o.gray ? '#8f8c88' : '#8d5d38', R = rng(goods.length * 7 + (o.seed || 0));
    k.post(0, 0, 0, 3.0, 0.95, 1.3, wood).box(0, 0.99, 0, 3.2, 0.08, 1.48, woodD);
    for (let i = 0; i < 6; i++) k.box(-1.25 + i * 0.5, 0.48, 0.66, 0.06, 0.9, 0.03, woodD, { ink: 0 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 1.45, 0, sz * 0.62, 0.11, 2.4, 0.11, woodD);
    stripedAwning(k, 0, 2.48, 0.32, 3.5, 1.9, awn, { tilt: 0.26 });
    const top = 1.03, fill = (x, z, c, n = 6) => crate(k, x, top, z, 0.72, 0, c);
    if (goods === 'apples') { fill(-0.95, 0.05, ['#e2453a', '#d93a32']); fill(0, 0.05, ['#9cc24e', '#b5d35a']); fill(0.95, 0.05, ['#f2c14e', '#e2453a']); }
    else if (goods === 'veg') { fill(-0.95, 0.05, '#e2453a'); fill(0.95, 0.05, '#e88a2a'); for (let i = 0; i < 3; i++) k.ball(-0.3 + i * 0.3, top + 0.2, 0.05, 0.19, '#7fbf4f', { geo: GEO.ico1 }); for (let i = 0; i < 4; i++) k.add(GEO.cone6, 0.95 + (i - 1.5) * 0.14, top + 0.62, 0.3, 0.05, 0.36, 0.05, '#e88a2a', { rx: -1.4, ink: 0.005 }); }
    else if (goods === 'flowers') { for (let i = 0; i < 5; i++) { const x = -1.1 + i * 0.55; k.cyl(x, top, 0.05, 0.2, 0.36, ['#3e7fb0', '#c46a3a', '#e8e0d0'][i % 3], { geo: GEO.cyl8 }); const c0 = pick(FLOWERS, R); for (let j = 0; j < 6; j++) k.add(GEO.ico0, x + (R() - 0.5) * 0.32, top + 0.5 + R() * 0.25, 0.05 + (R() - 0.5) * 0.32, 0.09, 0.09, 0.09, R() < 0.8 ? c0 : pick(FLOWERS, R), { ink: 0 }); k.ball(x, top + 0.42, 0.05, 0.2, LEAF, { geo: GEO.ball6, ink: 0 }); } }
    else if (goods === 'cheese') { for (let i = 0; i < 3; i++) { k.cyl(-0.9 + i * 0.9, top, 0.05, 0.36, 0.22, '#f2c14e', { geo: GEO.cyl20 }); k.cyl(-0.9 + i * 0.9, top + 0.22, 0.05, 0.3, 0.2, '#f6d36a', { geo: GEO.cyl20 }); } k.box(0.45, top + 0.5, 0.1, 0.3, 0.2, 0.25, '#f6d36a', { ry: 0.5 }); }
    else if (goods === 'pots') { for (let i = 0; i < 5; i++) { const x = -1.15 + i * 0.57, c = ['#c46a3a', '#3e7fb0', '#e8e0d0', '#c46a3a', '#4f9a5a'][i]; k.ball(x, top + 0.24, 0.05, 0.24, c, { ry2: 0.26 }).cyl(x, top + 0.42, 0.05, 0.12, 0.18, c); } }
    else if (goods === 'fish') { k.box(0, top + 0.06, 0.05, 2.6, 0.12, 1.0, o.gray ? '#e4e6ea' : '#eef6fa'); for (let i = 0; i < 6; i++) { const x = -1.0 + i * 0.4; k.ball(x, top + 0.18, 0.05, 0.08, '#8fa3b0', { ry2: 0.07, rz2: 0.3 }).add(GEO.cone4, x, top + 0.18, 0.05 - 0.38, 0.1, 0.16, 0.03, '#7f939f', { rx: -Math.PI / 2, ink: 0 }); } }
    else if (goods === 'bread') { for (let i = 0; i < 5; i++) loaf(k, -1.1 + i * 0.55, top + 0.13, 0.1 + (i % 2) * 0.2, 0.22, i * 0.4); for (let i = 0; i < 3; i++) k.cyl(0.9 + i * 0.12, top, -0.35, 0.05, 0.85, '#e0a85c', { rz: 0.2 - i * 0.2, geo: GEO.cyl6 }); }
    crate(k, -2.0, 0, 0.35, 0.75, 0.15, goods === 'apples' ? ['#e2453a', '#9cc24e'] : null); crate(k, -2.0, 0.53, 0.32, 0.7, -0.1);
    worldBox(k, out, 0, 0, 1.65, 0.8); worldBox(k, out, -2.0, 0.35, 0.45, 0.4);
  }
  function drawRosa(k, out) {
    const S = LM.stall; k.frame(S.x, GY, S.z, Math.PI / 2);
    stall(k, out, 'apples', ['#e0503f', '#fff4e4'], { seed: 1 });
    k.cyl(0, 2.75, 0.95, 0.03, 0.55, '#4a3a33', { geo: GEO.cyl6 }).ball(0, 3.42, 0.95, 0.3, '#e2453a').cyl(0.02, 3.68, 0.95, 0.03, 0.18, '#5b3a22', { geo: GEO.cyl6 }).ball(0.13, 3.78, 0.95, 0.1, LEAF, { ry2: 0.04, rz2: 0.06 });
    // a wheelbarrow of apples at the corner of the street
    k.frame(-15.4, GY, -124.6, 0.6);
    k.post(0, 0.35, 0, 0.9, 0.42, 1.3, '#a8784e').add(GEO.cyl20, 0, 0.25, 0.75, 0.25, 0.1, 0.25, '#4a3a33', { rz: Math.PI / 2 }).beam(-0.35, 0.45, -0.6, -0.4, 0.75, -1.4, 0.07, '#8a5f3e').beam(0.35, 0.45, -0.6, 0.4, 0.75, -1.4, 0.07, '#8a5f3e');
    for (let i = 0; i < 7; i++) k.ball(-0.25 + (i % 3) * 0.25, 0.86, -0.4 + (i / 3 | 0) * 0.35, 0.13, i % 4 ? '#e2453a' : '#9cc24e', { geo: GEO.ball6, ink: 0.006 });
    worldCol(k, out, 0, 0, 0.8);
  }
  function drawStalls(k, out) {
    out.keepers = [];
    for (const s of STALLS) {
      k.frame(s.x, GY, s.z, s.rot);
      stall(k, out, s.goods, s.awn, { gray: s.hushed, seed: Math.round(s.x) });
      const p = k.world(0, 0, -1.15); out.keepers.push({ x: p.x, z: p.z, yaw: s.rot, goods: s.goods, hushed: !!s.hushed });
    }
  }
  function drawYard(k, out) {
    const x0 = -32.5, x1 = -20.8, z0 = -162, z1 = -152, Y = { rail: 1, color: '#c79d6d', post: 0.13, h: 1.0, rails: [0.4, 0.8], step: 1.25 };
    k.frame(0, GY, 0, 0);
    fenceRun(k, out, x0, z0, x1, z0, Y); fenceRun(k, out, x0, z0, x0, z1, Y); fenceRun(k, out, x1, z0, x1, z1, Y);
    fenceRun(k, out, x0, z1, -25.4, z1, Y); fenceRun(k, out, -22.4, z1, x1, z1, Y);
    for (const x of [-25.4, -22.4]) k.post(x, 0, z1, 0.22, 1.5, 0.22, '#8a5f3e').ball(x, 1.6, z1, 0.15, '#8a5f3e');
    // straw dummies, a weapon rack, hay, a target
    out.dummies = [];
    for (const [x, z] of [[-29.6, -159.3], [-26.6, -160.2], [-23.6, -159.4]]) {
      k.cyl(x, 0, z, 0.08, 1.1, '#8a5f3e', { geo: GEO.cyl8 }).ball(x, 1.3, z, 0.36, '#e3c26a', { ry2: 0.5, rz2: 0.3 }).ball(x, 1.98, z, 0.25, '#e8c870');
      k.cyl(x, 1.45, z, 0.06, 1.3, '#e3c26a', { rz: Math.PI / 2, geo: GEO.cyl8 }).cyl(x, 1.08, z, 0.37, 0.06, '#8a5f3e', { geo: GEO.cyl20, ink: 0 });
      k.add(GEO.cyl20, x, 1.32, z + 0.3, 0.2, 0.03, 0.2, '#fdf8ee', { rx: Math.PI / 2 - 0.15, ink: 0.006 }).add(GEO.cyl20, x, 1.32, z + 0.31, 0.12, 0.03, 0.12, '#d64b3c', { rx: Math.PI / 2 - 0.15, ink: 0 });
      out.colliders.push({ x, z, r: 0.42 }); out.dummies.push({ x, z });
    }
    k.post(-31.9, 0, -155.5, 0.12, 1.5, 2.2, '#8a5f3e').box(-31.75, 1.15, -155.5, 0.12, 0.1, 2.3, '#a8784e');
    for (let i = 0; i < 5; i++) k.beam(-31.6, 0.05, -156.4 + i * 0.45, -31.9, 1.45, -156.4 + i * 0.45, 0.07, i % 2 ? '#c79d6d' : '#a8784e', { t2: 0.03 }).box(-31.62, 0.95, -156.4 + i * 0.45, 0.05, 0.05, 0.22, '#5b3a22', { ink: 0 });
    out.colliders.push({ obox: 1, x: -31.8, z: -155.5, hw: 0.3, hd: 1.2, rot: 0 });
    for (const [x, z, ry, y] of [[-31.3, -153.2, 0.1, 0], [-21.9, -161.0, 0.3, 0], [-21.95, -160.9, 0.1, 0.62]]) { k.post(x, y, z, 1.2, 0.62, 0.72, '#e8c46a', { ry }); for (const s of [-0.3, 0.3]) k.box(x + Math.cos(ry) * s, y + 0.31, z - Math.sin(ry) * s, 0.06, 0.64, 0.75, '#b99a4a', { ry, ink: 0 }); if (!y) out.colliders.push({ obox: 1, x, z, hw: 0.65, hd: 0.42, rot: ry }); }
    k.beam(-21.6, 0, -156.4, -21.6, 1.3, -156.9, 0.08, '#8a5f3e').beam(-21.3, 0, -157.4, -21.6, 1.3, -156.9, 0.08, '#8a5f3e').beam(-21.9, 0, -157.4, -21.6, 1.3, -156.9, 0.08, '#8a5f3e');
    [['#fdf8ee', 0.62], ['#d64b3c', 0.48], ['#fdf8ee', 0.32], ['#d64b3c', 0.16]].forEach(([c, r], i) => k.add(GEO.cyl20, -21.6 - i * 0.012, 1.45, -156.85, r, 0.05, r, c, { rz: Math.PI / 2, ink: i ? 0 : 0.01 }));
    out.colliders.push({ x: -21.6, z: -156.9, r: 0.55 });
    barrel(k, -31.6, 0, -161.2); out.colliders.push({ x: -31.6, z: -161.2, r: 0.42 });
  }
  function drawPond(k, out) {
    const A = { x: 6.4, z: -177.2, r: 3.7 }, B = { x: 12.2, z: -179.6, r: 3.1 };
    k.frame(0, GY, 0, 0);
    for (const L of [A, B]) k.add(GEO.disc64, L.x, 0.06, L.z, L.r, 1, L.r, '#4fa8cc', { b: 'water' }).add(GEO.disc64, L.x, 0.02, L.z, L.r + 0.25, 1, L.r + 0.25, '#a99f8a', { b: 'earth' });
    const R = rng(8), inside = (x, z, L) => Math.hypot(x - L.x, z - L.z) < L.r - 0.05;
    for (const [L, O] of [[A, B], [B, A]]) for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, x = L.x + Math.cos(a) * (L.r + 0.1), z = L.z + Math.sin(a) * (L.r + 0.1); if (inside(x, z, O)) continue; k.ball(x, 0.1, z, 0.34 + R() * 0.12, R() < 0.5 ? '#b8b4a8' : '#c9c3b4', { ry2: 0.17, geo: GEO.ball6, ry: R() * 3, ink: 0.01 }); }
    for (let i = 0; i < 9; i++) { const L = i % 2 ? A : B, a = R() * TAU, r = R() * (L.r - 1); const x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r; k.add(GEO.disc, x, 0.075, z, 0.34, 1, 0.34, '#5fae4f', { b: 'water', ry: R() * 3 }); if (i % 3 === 0) k.add(GEO.ico0, x, 0.13, z, 0.09, 0.07, 0.09, '#ff8fb1', { ink: 0 }); }
    for (let i = 0; i < 14; i++) { const L = i % 2 ? A : B, a = R() * TAU; const x = L.x + Math.cos(a) * (L.r - 0.25), z = L.z + Math.sin(a) * (L.r - 0.25); if (Math.hypot(x - 9.6, z + 178.5) < 2) continue; k.cyl(x, 0.05, z, 0.025, 0.8 + R() * 0.5, '#5f9a45', { geo: GEO.cyl6, ink: 0 }).cyl(x, 0.75 + R() * 0.3, z, 0.05, 0.2, '#7a4f2e', { geo: GEO.cyl6, ink: 0 }); }
    // the footbridge over the waist
    const W = { x: 9.6, z: -178.5 }, dx = 0.382, dz = 0.924, ry = Math.atan2(dx, dz), half = 2.5, lift = 0.55;
    const yAt = t => lift * (1 - t * t);
    k.frame(W.x, GY, W.z, ry);
    for (let i = 0; i < 10; i++) {
      const t0 = -1 + i * 0.2, t1 = t0 + 0.2, tm = (t0 + t1) / 2, z0 = t0 * half, z1 = t1 * half, y0 = yAt(t0), y1 = yAt(t1);
      k.box(0, (y0 + y1) / 2 + 0.08, (z0 + z1) / 2, 1.4, 0.1, Math.hypot(z1 - z0, y1 - y0) + 0.03, i % 2 ? '#b07a48' : '#a36f40', { rx: -Math.atan2(y1 - y0, z1 - z0) });
      if (i % 2 === 0) for (const s of [-1, 1]) k.cyl(s * 0.66, yAt(tm), tm * half, 0.05, 0.66, '#8a5f3e', { geo: GEO.cyl6 });
    }
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const t0 = -1 + i * 0.4, t1 = t0 + 0.4; k.beam(s * 0.66, yAt(t0) + 0.66, t0 * half, s * 0.66, yAt(t1) + 0.66, t1 * half, 0.06, '#a8784e', { ink: 0.006 }); }
    out.platforms.push({ seg: [W.x - dx * half, W.z - dz * half, W.x, W.z], w: 1.3, y: [GY, GY + lift + 0.13] }, { seg: [W.x, W.z, W.x + dx * half, W.z + dz * half], w: 1.3, y: [GY + lift + 0.13, GY] });
    out.colliders.push({ x: 6.0, z: -177.0, r: 3.1 }, { x: 12.6, z: -179.8, r: 2.5 });
    out.pond = { A, B, bridge: W };
    k.frame(0, GY, 0, 0); bench(k, out, 6.3, -172.4, Math.PI); bench(k, out, 14.2, -174.8, Math.PI * 0.8);
  }
  function waterMat() {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true, transparent: true, opacity: 0.93 });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = 'varying vec3 vWP2;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWP2 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uTime;\nvarying vec3 vWP2;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', `
        float sp = sin(vWP2.x * 2.3 + uTime * 1.2) * sin(vWP2.z * 2.7 - uTime * 0.9) * sin(vWP2.x * 0.7 - vWP2.z * 1.3 + uTime * 0.5);
        gl_FragColor.rgb += smoothstep(0.5, 0.72, sp) * 0.28;
        #include <tonemapping_fragment>`);
    };
    m.customProgramCacheKey = () => 'town-water';
    return m;
  }
  // ------------------------------------------------------------ townsfolk: drawn like ACTORS.villager, but every body part of every
  // person shares one instanced mesh (and one ink hull), so 25 people cost about 20 draw calls
  const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 13);
  const PART = {
    lathe: { geo: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02 },
    head: { geo: new THREE.SphereGeometry(1, 14, 10), ink: 0.02 },
    ball: { geo: new THREE.SphereGeometry(1, 8, 6), ink: 0.03 },
    cap: { geo: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5), ink: 0.02 },
    cyl: { geo: new THREE.CylinderGeometry(1, 1, 1, 8), ink: 0.03 },
    cone: { geo: new THREE.ConeGeometry(1, 1, 8), ink: 0.03 },
    box: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0.03 },
    eye: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, mat: () => toonM({ color: '#2b2235' }) },
    hl: { geo: new THREE.SphereGeometry(1, 5, 3), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#ffffff' }) },
    blush: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#ff8c9a', transparent: true, opacity: 0.5, depthWrite: false }) },
    ring: { geo: new THREE.TorusGeometry(1, 0.12, 5, 16), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#2b2235' }) },
    arc: { geo: new THREE.TorusGeometry(1, 0.32, 5, 10, Math.PI), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#2b2235' }) },
  };
  const SKINS = ['#f5cda2', '#efc29a', '#e6b48c', '#c98e62', '#a8714a', '#f0c7a0', '#8a5a3c', '#dcae86'];
  const HAIRS = ['#2e2420', '#4a2f27', '#6b3b25', '#c98a4a', '#e0b060', '#3a2b26', '#8a4a2a'];
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88).getHexString(); };
  function Rig() {
    const leaves = Object.fromEntries(Object.keys(PART).map(k => [k, []]));
    // a node that draws one part (TK.part's shape and ink, but instanced)
    function leaf(parent, part, color, pos, scale, rot) {
      const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (scale) n.scale.set(...scale); if (rot) n.rotation.set(...rot);
      parent.add(n); leaves[part].push({ n, color }); return n;
    }
    const node = (parent, pos, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (rot) n.rotation.set(...rot); parent.add(n); return n; };
    // the instanced meshes, one per part (+ ink), filled from the nodes' world matrices every frame
    function meshes(group) {
      const list = [], col = new THREE.Color();
      for (const [name, L] of Object.entries(leaves)) {
        if (!L.length) continue;
        const P = PART[name], mat = P.mat ? P.mat() : toonM({ rim: 0.32 });
        const im = new THREE.InstancedMesh(P.geo, mat, L.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = P.ink > 0; im.receiveShadow = false; im.name = 'folk-' + name;
        if (!P.mat) L.forEach((l, i) => im.setColorAt(i, col.set(l.color)));
        group.add(im); list.push({ im, L });
        if (P.ink) { const h = new THREE.InstancedMesh(P.geo, inkM({ off: P.ink }), L.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = 'folk-' + name + '-ink'; group.add(h); list.push({ im: h, L: null }); }
      }
      return {
        list,
        sync() { for (const { im, L } of list) { if (!L) continue; for (let i = 0; i < L.length; i++) im.setMatrixAt(i, L[i].n.matrixWorld); im.instanceMatrix.needsUpdate = true; } },
      };
    }
    return { leaf, node, meshes, leaves };
  }

  // One townsperson. d: { skin, hair, dress, apron, hairdo: cap|bun|pony|long|bald, hat, beard, stache, glasses, legs, pants, shoes, h, w, eyes, hushed, prop }
  function makePerson(rig, d) {
    const { leaf, node } = rig, g = d.hushed ? grayOf : c => c;
    const C = { skin: g(d.skin), hair: g(d.hair), dress: g(d.dress), apron: d.apron && g(d.apron), pants: g(d.pants || '#3a4466'), shoes: g(d.shoes || '#5b3a22'), hat: g(d.hatColor || '#e8c57a') };
    const root = new THREE.Object3D(), body = node(root), w = d.w || 1;
    root.scale.setScalar(d.h || 1);
    const R = { root, body, d, legs: null, feet: [], arms: [], head: null, eyes: [], mouth: null, props: {} };
    if (d.legs) {
      leaf(body, 'lathe', C.dress, [0, 0.36, 0], [w, 0.64, w]);
      R.legs = [-1, 1].map(s => { const hip = node(body, [s * 0.12 * w, 0.4, 0]); leaf(hip, 'cyl', C.pants, [0, -0.18, 0], [0.085, 0.36, 0.085]); R.feet.push(leaf(hip, 'ball', C.shoes, [0, -0.36, 0.05], [0.1, 0.075, 0.15])); return hip; });
    } else {
      leaf(body, 'lathe', C.dress, null, [w, 1, w]);
      R.feet = [-1, 1].map(s => leaf(body, 'ball', C.shoes, [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]));
    }
    if (d.apron) leaf(body, 'ball', C.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    if (d.bag) { leaf(body, 'box', g('#8a5f3e'), [0.3 * w, 0.42, 0.08], [0.12, 0.3, 0.34]); leaf(body, 'box', g('#6b4a33'), [0.05, 0.62, 0.12], [0.6 * w, 0.05, 0.05], [0, 0, 0.75]); }
    R.arms = [-1, 1].map(s => {
      const sh = node(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      leaf(sh, 'cyl', C.dress, [0, -0.14, 0], [0.07, 0.28, 0.07]);
      const hand = node(sh, [0, -0.3, 0]); leaf(hand, 'ball', C.skin, null, [0.07, 0.07, 0.07]);
      sh.userData.hand = hand; return sh;
    });
    const head = R.head = node(body, [0, 0.98, 0]);
    leaf(head, 'head', C.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]);
    if (d.hairdo !== 'bald') leaf(head, 'cap', C.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], [-0.5, 0, 0]);
    else leaf(head, 'cap', C.hair, [0, 0.14, -0.06], [0.285, 0.2, 0.26], [-1.1, 0, 0]);
    if (d.grows) {     // (hairAt: Hugo's hair grows back: a full head of hair rising out of his scalp, then a quiff)
      R.grow = leaf(head, 'cap', C.hair, [0, 0.22, -0.02], [1e-4, 1e-4, 1e-4], [-0.5, 0, 0]);
      R.quiff = leaf(head, 'ball', C.hair, [0, 0.42, 0.1], [1e-4, 1e-4, 1e-4], [0.5, 0, 0]);
    }
    if (d.hairdo === 'bun') leaf(head, 'ball', C.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]);
    if (d.hairdo === 'pony') { leaf(head, 'ball', C.hair, [0, 0.3, -0.27], [0.08, 0.08, 0.08]); leaf(head, 'ball', C.hair, [0, 0.14, -0.33], [0.08, 0.17, 0.08], [0.3, 0, 0]); }
    if (d.hairdo === 'long') leaf(head, 'ball', C.hair, [0, 0.1, -0.1], [0.28, 0.3, 0.2]);
    if (d.hairdo === 'pigtails') for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.27, 0.12, -0.08], [0.09, 0.14, 0.09]);
    R.eyes = [-1, 1].map(s => {
      if (d.eyes === 'happy' && !d.hushed) { const e = node(head, [s * 0.1, 0.2, 0.255]); leaf(e, 'arc', null, null, [0.035, 0.035, 0.035]); return e; }
      const e = node(head, [s * 0.1, 0.21, 0.24]);
      leaf(e, 'eye', null, null, [0.04, d.hushed ? 0.045 : 0.06, 0.025]);
      if (!d.hushed) leaf(e, 'hl', null, [0.013, 0.023, 0.022], [0.017, 0.017, 0.017]);
      return e;
    });
    if (!d.hushed) [-1, 1].forEach(s => leaf(head, 'blush', null, [s * 0.17, 0.09, 0.23], [0.05, 0.0275, 0.015], [0, s * 0.4, 0]));
    R.mouth = leaf(head, 'eye', null, [0, 0.07, 0.27], [0.035, 0.012, 0.01]);
    if (d.stache) for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.05, 0.11, 0.255], [0.06, 0.025, 0.03], [0, 0, -s * 0.35]);
    if (d.beard) leaf(head, 'ball', C.hair, [0, 0.03, 0.12], [0.21, 0.17, 0.16]);
    if (d.glasses) for (const s of [-1, 1]) leaf(head, 'ring', null, [s * 0.1, 0.19, 0.265], [0.068, 0.068, 0.068]);
    const hat = node(head, [0, 0.4, 0]);
    if (d.hat === 'straw') { leaf(hat, 'cyl', C.hat, null, [0.5, 0.035, 0.5]); leaf(hat, 'cap', C.hat, [0, 0.01, 0], [0.22, 0.2, 0.22]); leaf(hat, 'cyl', g('#e05a4b'), [0, 0.05, 0], [0.225, 0.05, 0.225]); }
    else if (d.hat === 'cap') { leaf(hat, 'cap', C.hat, [0, -0.08, 0], [0.3, 0.22, 0.3]); leaf(hat, 'cyl', C.hat, [0, -0.08, 0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'beret') leaf(hat, 'ball', C.hat, [0.04, -0.07, -0.02], [0.3, 0.09, 0.3], [0, 0, 0.2]);
    else if (d.hat === 'scarf') { leaf(hat, 'cap', C.hat, [0, -0.2, -0.01], [0.31, 0.32, 0.31], [-0.25, 0, 0]); leaf(hat, 'ball', C.hat, [0, -0.32, -0.27], [0.08, 0.08, 0.08]); }
    else if (d.hat === 'chef') { leaf(hat, 'cyl', '#ffffff', [0, 0.02, 0], [0.22, 0.14, 0.22]); leaf(hat, 'ball', '#ffffff', [0, 0.16, 0], [0.27, 0.16, 0.27]); }
    else if (d.hat === 'flat') { leaf(hat, 'cap', C.hat, [0, -0.1, 0.02], [0.31, 0.14, 0.33]); leaf(hat, 'cyl', C.hat, [0, -0.1, 0.27], [0.15, 0.02, 0.1]); }
    // things people carry
    const handR = R.arms[1].userData.hand, handL = R.arms[0].userData.hand, P = R.props;
    if (d.prop === 'broom') { P.broom = node(body, [0.05, 0.5, 0.38], [0.35, 0, 0]); leaf(P.broom, 'cyl', g('#a8784e'), [0, 0.1, 0], [0.025, 1.3, 0.025]); leaf(P.broom, 'cone', g('#e3c26a'), [0, -0.62, 0], [0.16, 0.34, 0.07]); }
    if (d.prop === 'can') { P.can = node(handR, [0, -0.08, 0.06]); leaf(P.can, 'cyl', g('#4f9a5a'), null, [0.12, 0.2, 0.12]); leaf(P.can, 'cyl', g('#4f9a5a'), [0, 0.02, 0.17], [0.025, 0.28, 0.025], [1.0, 0, 0]); leaf(P.can, 'cyl', g('#4f9a5a'), [0, 0.12, -0.02], [0.02, 0.18, 0.02], [0, 0, Math.PI / 2]); }
    if (d.prop === 'basket') { P.basket = node(handL, [0, -0.12, 0.04]); leaf(P.basket, 'cyl', g('#c9955a'), null, [0.17, 0.16, 0.13]); for (let i = 0; i < 3; i++) leaf(P.basket, 'ball', g(['#e2453a', '#f2c14e', '#9cc24e'][i]), [(i - 1) * 0.08, 0.09, 0], [0.06, 0.06, 0.06]); }
    if (d.prop === 'bread') { P.bread = node(body, [-0.3 * w, 0.62, 0.1], [0, 0.3, 0.2]); leaf(P.bread, 'ball', g('#d99a4e'), null, [0.1, 0.09, 0.26]); }
    if (d.prop === 'guitar') { P.guitar = node(body, [0.02, 0.5, 0.3], [0, 0, 0.9]); leaf(P.guitar, 'ball', g('#c9803a'), null, [0.2, 0.25, 0.07]); leaf(P.guitar, 'eye', null, [0, 0.04, 0.06], [0.06, 0.06, 0.01]); leaf(P.guitar, 'box', g('#6b4a33'), [0, 0.42, 0], [0.05, 0.5, 0.03]); leaf(P.guitar, 'box', g('#4a3a33'), [0, 0.7, 0], [0.07, 0.1, 0.04]); }
    if (d.prop === 'rod') { P.rod = node(handR, [0, 0, 0.02], [0.9, 0, 0]); leaf(P.rod, 'cyl', g('#8a5f3e'), [0, 0.9, 0], [0.018, 1.9, 0.018]); }
    if (d.prop === 'cane') { P.cane = node(handR, [0, 0, 0.03]); leaf(P.cane, 'cyl', g('#7a5236'), [0, -0.34, 0], [0.025, 0.72, 0.025]); leaf(P.cane, 'cyl', g('#7a5236'), [0, 0.02, -0.05], [0.025, 0.12, 0.025], [Math.PI / 2, 0, 0]); }
    if (d.prop === 'barrow') { P.barrow = node(body, [0, 0, 0.95]); leaf(P.barrow, 'box', g('#a8784e'), [0, 0.42, 0.25], [0.72, 0.36, 0.95]); leaf(P.barrow, 'cyl', g('#4a3a33'), [0, 0.2, 0.75], [0.2, 0.08, 0.2], [0, 0, Math.PI / 2]); for (let i = 0; i < 4; i++) leaf(P.barrow, 'ball', g(['#e88a2a', '#9cc24e', '#e2453a', '#f2c14e'][i]), [(i % 2 - 0.5) * 0.3, 0.66, 0.1 + (i >> 1) * 0.3], [0.13, 0.13, 0.13]); for (const s of [-1, 1]) leaf(P.barrow, 'cyl', g('#8a5f3e'), [s * 0.3, 0.52, -0.42], [0.03, 0.62, 0.03], [Math.PI / 2 - 0.3, 0, 0]); }
    if (d.prop === 'letter') { P.letter = node(handR, [0, -0.06, 0.05]); leaf(P.letter, 'box', '#fdf8ee', null, [0.2, 0.02, 0.14], [0.4, 0, 0]); }
    if (d.prop === 'shirt') { P.shirt = node(body, [0, 1.62, 0.3]); leaf(P.shirt, 'box', g('#8fd3ec'), null, [0.5, 0.5, 0.03]); leaf(P.shirt, 'box', g('#8fd3ec'), [0, 0.18, 0], [0.8, 0.16, 0.03]); }
    if (d.prop === 'ball') { P.ball = node(root, [0.3, 0.12, 0.35]); leaf(P.ball, 'ball', g('#e0503f'), null, [0.12, 0.12, 0.12]); }
    if (d.tipHat) { P.hat = node(root, [0.5, 0.0, 0.45]); leaf(P.hat, 'cap', g('#3a3040'), [0, 0.01, 0], [0.24, 0.12, 0.24], [Math.PI, 0, 0]); leaf(P.hat, 'cyl', g('#3a3040'), [0, 0.02, 0], [0.3, 0.02, 0.3]); for (let i = 0; i < 3; i++) leaf(P.hat, 'cyl', '#e6b84a', [(i - 1) * 0.07, 0.06, 0.02 * i], [0.04, 0.01, 0.04]); }
    return R;
  }
  // Hugo the sweeper's hair grows back as the story goes on (DESIGN.md 14.8). k (0 to 1): a full head of hair rises out of
  // his scalp, first a patch on the crown, then over the top and down the sides (a cap just under the skin, growing until
  // it's an ordinary haircut); q (0 to 1): a proud quiff on top (the later bells)
  function hairAt(R, k, q) {
    if (!R.grow) return;
    const r = k > 0 ? 0.25 + 0.042 * clamp(k, 0, 1) : 1e-4;
    R.grow.scale.set(r, r, r);
    const u = Math.max(1e-4, clamp(q, 0, 1));
    R.quiff.scale.set(0.15 * u, 0.09 * u, 0.13 * u); R.quiff.position.set(0, 0.42 + 0.03 * u, 0.1);
  }
  // Animals: Pipa the dog, the cats, pigeons, ducks
  function makeAnimal(rig, kind, color) {
    const { leaf, node } = rig, root = new THREE.Object3D(), body = node(root), A = { root, body, kind, legs: [], tail: null, head: null, wings: [] };
    if (kind === 'dog') {
      leaf(body, 'ball', color, [0, 0.36, 0], [0.2, 0.18, 0.34]);
      A.head = node(body, [0, 0.55, 0.3]); leaf(A.head, 'ball', color, null, [0.17, 0.16, 0.17]); leaf(A.head, 'ball', '#f3e2c6', [0, -0.04, 0.14], [0.09, 0.07, 0.1]); leaf(A.head, 'eye', null, [0, -0.01, 0.24], [0.04, 0.03, 0.03]);
      for (const s of [-1, 1]) { leaf(A.head, 'eye', null, [s * 0.07, 0.05, 0.13], [0.03, 0.035, 0.02]); leaf(A.head, 'hl', null, [s * 0.07 + 0.01, 0.065, 0.145], [0.01, 0.01, 0.01]); leaf(A.head, 'ball', '#7a4f2e', [s * 0.15, 0.04, -0.02], [0.05, 0.12, 0.08], [0, 0, s * 0.3]); }
      for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const hip = node(body, [x * 0.1, 0.26, z * 0.2]); leaf(hip, 'cyl', color, [0, -0.11, 0], [0.05, 0.24, 0.05]); A.legs.push(hip); }
      A.tail = node(body, [0, 0.45, -0.32], [-0.7, 0, 0]); leaf(A.tail, 'ball', color, [0, 0.1, 0], [0.04, 0.12, 0.04]);
    } else if (kind === 'cat') {
      leaf(body, 'ball', color, [0, 0.13, 0], [0.17, 0.13, 0.24]);
      A.head = node(body, [0, 0.2, 0.2]); leaf(A.head, 'ball', color, null, [0.12, 0.11, 0.11]);
      for (const s of [-1, 1]) { leaf(A.head, 'cone', color, [s * 0.065, 0.11, 0], [0.04, 0.08, 0.03], [0, 0, -s * 0.2]); A.legs.push(leaf(A.head, 'eye', null, [s * 0.045, 0.02, 0.1], [0.025, 0.004, 0.01])); }
      leaf(A.head, 'ball', '#f2a0a8', [0, -0.02, 0.11], [0.015, 0.012, 0.01]);
      A.tail = node(body, [0, 0.08, -0.2], [0, 0, 0]); leaf(A.tail, 'cyl', color, [0.08, 0, -0.06], [0.035, 0.28, 0.035], [Math.PI / 2, 0.9, 0]);
    } else if (kind === 'pigeon') {
      leaf(body, 'ball', color, [0, 0.1, 0], [0.08, 0.075, 0.12]);
      A.head = node(body, [0, 0.19, 0.08]); leaf(A.head, 'ball', '#8a8f9e', null, [0.05, 0.05, 0.05]); leaf(A.head, 'cone', '#e6b84a', [0, -0.005, 0.06], [0.015, 0.04, 0.015], [Math.PI / 2, 0, 0]); for (const s of [-1, 1]) leaf(A.head, 'eye', null, [s * 0.035, 0.015, 0.03], [0.01, 0.01, 0.01]);
      A.wings = [-1, 1].map(s => { const wg = node(body, [s * 0.07, 0.13, 0]); leaf(wg, 'ball', '#9aa0ad', [s * 0.02, 0, -0.02], [0.03, 0.06, 0.1]); return wg; });
    } else if (kind === 'duck') {
      leaf(body, 'ball', color, [0, 0.06, 0], [0.15, 0.1, 0.22]); leaf(body, 'ball', color, [0, 0.12, -0.2], [0.06, 0.05, 0.06], [0.6, 0, 0]);
      A.head = node(body, [0, 0.22, 0.14]); leaf(A.head, 'ball', color === '#fdf8ee' ? '#fdf8ee' : '#3f8a4e', null, [0.08, 0.08, 0.08]); leaf(A.head, 'box', '#f2a03a', [0, -0.01, 0.09], [0.06, 0.02, 0.07]); for (const s of [-1, 1]) leaf(A.head, 'eye', null, [s * 0.05, 0.02, 0.05], [0.012, 0.012, 0.012]);
    }
    return A;
  }
  // ------------------------------------------------------------ the cast: who lives here, what they do, what they say
  // Lines: en has slots the game weaves ({c.*} everyday words, {w.*} words Mimo can learn, :f a woman's/feminine form);
  // es (Latin American), pt (Brazilian) and de say the same thing naturally, with {w.*} where the taught word is.
  // Nobody assumes the player's gender.
  const LINES = {
    hugo: { en: 'I sweep here every morning. A clean {c.village} is a happy {c.village}!', es: 'Barro aquí todas las mañanas. ¡Un pueblo limpio es un pueblo feliz!', pt: 'Eu varro aqui toda manhã. Vila limpa é vila feliz!', de: 'Ich fege hier jeden Morgen. Ein sauberes Dorf ist ein fröhliches Dorf!' },
    lena: { en: 'A little {w.water} every morning, and look at this {w.flower}!', es: 'Un poco de {w.water} cada mañana, ¡y mira esta {w.flower}!', pt: 'Um pouco de {w.water} toda manhã, e olha só essa {w.flower}!', de: 'Jeden Morgen ein bisschen {w.water}, und schau dir diese {w.flower} an!' },
    mila: { en: "Everything's fresh from the fields! Have a look, {c.please}.", es: '¡Todo fresco del campo! Echa un vistazo, por favor.', pt: 'Tudo fresquinho do campo! Dá uma olhada, por favor.', de: 'Alles frisch vom Feld! Schau doch mal, bitte.' },
    vera: { en: 'A {w.flower} for you? {c.yes}, it’s free today!', es: '¿Una {w.flower} para ti? ¡Sí, hoy es gratis!', pt: 'Uma {w.flower} pra você? Sim, hoje é de graça!', de: 'Eine {w.flower} für dich? Ja, heute gratis!' },
    teo: { en: 'This {w.bread} is for my grandma. She lives in the blue {w.house}.', es: 'Este {w.bread} es para mi abuela. Vive en la {w.house} azul.', pt: 'Este {w.bread} é pra minha avó. Ela mora na {w.house} azul.', de: 'Das {w.bread} ist für meine Oma. Sie wohnt im blauen {w.house}.' },
    otto: { en: 'When I was young, the whole {c.village} sang. Now listen... so quiet.', es: 'Cuando era joven, todo el pueblo cantaba. Y ahora, escucha... qué silencio.', pt: 'Quando eu era jovem, a vila inteira cantava. E agora, escuta... que silêncio.', de: 'Als ich jung war, hat das ganze Dorf gesungen. Und jetzt, hör mal... so still.' },
    lola: { en: 'I climbed that {w.tree}! Well... almost.', es: '¡Me subí a ese {w.tree}! Bueno... casi.', pt: 'Eu subi naquela {w.tree}! Bom... quase.', de: 'Ich bin auf den {w.tree} da geklettert! Na ja... fast.' },
    leo: { en: 'This is Pipa. She’s my best {c.friend:f}!', es: 'Esta es Pipa. ¡Es mi mejor amiga!', pt: 'Essa é a Pipa. Ela é a minha melhor amiga!', de: 'Das ist Pipa. Sie ist meine beste Freundin!' },
    ana: { en: 'Did you hear? Old Pedro doesn’t talk anymore either.', es: '¿Ya supiste? Don Pedro tampoco habla ya.', pt: 'Ficou sabendo? O seu Pedro também não fala mais.', de: 'Hast du gehört? Der alte Pedro redet auch nicht mehr.' },
    emil: { en: 'Not one fish today. Even the {w.water} is quiet.', es: 'Hoy ni un pez. Hasta el {w.water} está callada.', pt: 'Nem um peixe hoje. Até a {w.water} está quieta.', de: 'Heute kein einziger Fisch. Sogar das {w.water} ist still.' },
    tito: { en: 'You stopped to listen! {c.thanks}!', es: '¡Te paraste a escuchar! ¡Gracias!', pt: 'Você parou pra ouvir! Obrigado!', de: 'Du bleibst stehen und hörst zu! Danke!' },
    clara: { en: 'Have you tried an {w.apple} from Rosa’s stall? Best in the {c.village}!', es: '¿Ya probaste una {w.apple} del puesto de doña Rosa? ¡Las mejores del pueblo!', pt: 'Já provou uma {w.apple} da barraca da dona Rosa? As melhores da vila!', de: 'Schon mal einen {w.apple} von Oma Rosas Stand probiert? Die besten im Dorf!' },
  };
  // zh / ja (CJK.md's notation): grown-ups are polite to you in ja; Teo and Lola are kids, so casual. Pipa is Leo's dog.
  Object.entries({
    hugo: ['[我|wǒ] [每天|měi tiān] [早上|zǎo shang] [在|zài] [这里|zhè lǐ] [扫地|sǎo dì] 。 [干净|gān jìng] [的|de] [村子|cūn zi] ， [快乐|kuài lè] [的|de] [村子|cūn zi] ！', '[毎朝|まいあさ] 、 ここ を [掃除|そうじ] して います 。 きれい な [村|むら] は 、 [幸|しあわ]せ な [村|むら] です ！'],
    lena: ['[每天|měi tiān] [早上|zǎo shang] [浇|jiāo] [一点|yī diǎn] {w.water} ， [你|nǐ] [看|kàn] [这|zhè] [朵|duǒ] {w.flower} ！', '[毎朝|まいあさ] 、 [少|すこ]し {w.water} を あげる と … [見|み]て ください 、 この {w.flower} ！'],
    mila: ['[都|dōu] [是|shì] [地里|dì lǐ] [刚|gāng] [摘|zhāi] [的|de] ！ [请|qǐng] [看看|kàn kan] [吧|ba] 。', 'ぜんぶ [畑|はたけ] から とれたて です よ ！ どうぞ 、 [見|み]て いって ください 。'],
    vera: ['[送|sòng] [你|nǐ] [一|yī] [朵|duǒ] {w.flower} ？ [对|duì] ， [今天|jīn tiān] [免费|miǎn fèi] ！', 'この {w.flower} 、 いかが です か ？ はい 、 [今日|きょう] は ただ です よ ！'],
    teo: ['[这个|zhè ge] {w.bread} [是|shì] [给|gěi] [我|wǒ] [奶奶|nǎi nai] [的|de] 。 [她|tā] [住|zhù] [在|zài] [那|nà] [座|zuò] [蓝色|lán sè] [的|de] {w.house} [里|lǐ] 。', 'この {w.bread} 、 おばあちゃん に あげる ん だ 。 [青|あお]い {w.house} に [住|す]んでる よ 。'],
    otto: ['[我|wǒ] [年轻|nián qīng] [的|de] [时候|shí hou] ， [整个|zhěng gè] [村子|cūn zi] [都|dōu] [在|zài] [唱歌|chàng gē] 。 [现在|xiàn zài] [你|nǐ] [听|tīng] … [多|duō] [安静|ān jìng] 。', 'わたし が [若|わか]い [頃|ころ] は 、 [村|むら]じゅう が [歌|うた]って いました 。 [今|いま] は … ほら 、 こんなに [静|しず]か です 。'],
    lola: ['[我|wǒ] [爬|pá] [上|shàng] [了|le] [那|nà] [棵|kē] {w.tree} ！ [好|hǎo] [吧|ba] … [差不多|chà bù duō] 。', 'あの {w.tree} に [登|のぼ]った よ ！ … まあ 、 だいたい ね 。'],
    leo: ['[这|zhè] [是|shì] [皮帕|Pí pà] 。 [它|tā] [是|shì] [我|wǒ] [最|zuì] [好|hǎo] [的|de] [朋友|péng you] ！', 'この [子|こ] は ピパ です 。 いちばん の [友達|ともだち] な ん です ！'],
    ana: ['[你|nǐ] [听说|tīng shuō] [了|le] [吗|ma] ？ [老|lǎo] [佩德罗|Pèi dé luó] [也|yě] [不|bù] [说话|shuō huà] [了|le] 。', '[聞|き]きました ？ ペドロ さん も 、 もう [話|はな]さない ん です って 。'],
    emil: ['[今天|jīn tiān] [一|yī] [条|tiáo] [鱼|yú] [都|dōu] [没有|méi yǒu] 。 [连|lián] {w.water} [都|dōu] [这么|zhè me] [安静|ān jìng] 。', '[今日|きょう] は [魚|さかな] が [一匹|いっぴき] も [釣|つ]れません 。 {w.water} まで [静|しず]か です 。'],
    tito: ['[你|nǐ] [停|tíng] [下来|xià lái] [听|tīng] [了|le] ！ [谢谢|xiè xie] ！', '[足|あし] を [止|と]めて [聞|き]いて くれた ん です ね ！ ありがとう ございます ！'],
    clara: ['[你|nǐ] [尝|cháng] [过|guo] [罗莎|Luó shā] [奶奶|nǎi nai] [摊|tān] [上|shàng] [的|de] {w.apple} [吗|ma] ？ [村子|cūn zi] [里|lǐ] [最|zuì] [好|hǎo] [的|de] ！', 'ロサ さん の [店|みせ] の {w.apple} 、 [食|た]べた こと あります か ？ [村|むら] で いちばん です よ ！'],
  }).forEach(([k, [zh, ja]]) => { if (LINES[k]) Object.assign(LINES[k], { zh, ja }); });
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ピパ', 'ペドロ']);
  const SK = SKINS;
  function castOf(out) {
    const ring = (a, r) => [PLAZA.x + Math.cos(a * Math.PI / 180) * r, PLAZA.z + Math.sin(a * Math.PI / 180) * r];
    const keeper = g => out.keepers.find(k => k.goods === g);
    const benchNear = (x, z) => out.benches.reduce((b, q) => (Math.hypot(q.x - x, q.z - z) < Math.hypot(b.x - x, b.z - z) ? q : b), out.benches[0]);
    const blue = HOUSES.find(h => h.blue), bd = blue && blue.doorAt ? [blue.doorAt.x, blue.doorAt.z] : [-12, -170];
    const westFronts = HOUSES.filter(h => h.street === 'west' && h.z > -147.5 && h.doorAt).sort((a, b) => b.x - a.x).slice(0, 3)
      .map(h => ({ x: h.doorAt.x + Math.sin(h.rot) * 0.2, z: h.doorAt.z + Math.cos(h.rot) * 0.2, yaw: h.rot + Math.PI }));
    const lau = out.laundry[0];
    const tree315 = out.roundBench.find(b => b.x > -8) || out.roundBench[0], tree135 = out.roundBench.find(b => b.x < -12) || out.roundBench[0];
    const pd = Math.atan2(PLAZA.x - tree315.x, PLAZA.z - tree315.z);
    const ez = x => eastZ(x);
    const otto = benchNear(...ring(160, 9.4));
    return [
      { id: 'hugo', name: 'Hugo', job: 'sweep', path: [[-6.2, -126.6], [-6.2, -133.4]], look: { skin: SK[3], hair: '#2e2420', hairdo: 'bald', grows: true, stache: true, dress: '#4f8a4a', apron: '#fdf8ee', legs: true, h: 1.05, w: 1.15 }, prop: 'broom' },
      { id: 'lena', name: 'Lena', job: 'water', stops: westFronts.length ? westFronts : [{ x: -30, z: -143.6, yaw: 0 }], look: { skin: SK[0], hair: '#c98a4a', hairdo: 'pony', dress: '#e6b84a', apron: '#fdf8ee', hat: 'straw' }, prop: 'can' },
      { id: 'mila', name: 'Mila', job: 'keeper', at: keeper('veg'), look: { skin: SK[2], hair: '#2e2420', hairdo: 'bun', dress: '#c9553f', apron: '#fdf8ee', hat: 'scarf', hatColor: '#f2c14e' } },
      { id: 'vera', name: 'Vera', job: 'keeper', at: keeper('flowers'), look: { skin: SK[5], hair: '#6b3b25', hairdo: 'long', dress: '#d97aa0', apron: '#fdf8ee', eyes: 'happy' } },
      { id: 'sofia', name: 'Sofia', job: 'keeper', at: keeper('cheese'), look: { skin: SK[4], hair: '#2e2420', hairdo: 'bun', dress: '#3f6f9a', apron: '#fdf8ee', glasses: true } },
      { id: 'jonas', name: 'Jonas', job: 'keeper', at: keeper('pots'), look: { skin: SK[1], hair: '#e0b060', dress: '#7a5ab0', legs: true, pants: '#4a3a33', hat: 'beret', hatColor: '#3a3040', beard: true } },
      { id: 'ruben', name: 'Rubén', job: 'keeper', hushed: true, at: keeper('fish'), look: { skin: SK[7], hair: '#3a2b26', dress: '#2f8f86', apron: '#e8e0d0', legs: true, hat: 'flat', hatColor: '#4a4a55', stache: true } },
      { id: 'lucas', name: 'Lucas', job: 'keeper', at: keeper('bread'), look: { skin: SK[6], hair: '#2e2420', dress: '#f2e6d0', apron: '#ffffff', legs: true, hat: 'chef' } },
      { id: 'teo', name: 'Teo', job: 'walk', speed: 1.5, pause: 3, path: [[3.4, -155.2], [0.8, -149.6], ring(330, 6.1), ring(300, 6.1), ring(270, 6.1), [-10.7, -157.5], [-10.7, bd[1]], bd], look: { skin: SK[3], hair: '#4a2f27', dress: '#e0743c', legs: true, hat: 'cap', hatColor: '#3d7fd1', h: 0.9 }, prop: 'bread' },
      { id: 'otto', name: 'Otto', job: 'sit', at: otto, look: { skin: SK[0], hair: '#f4f1ea', hairdo: 'bald', beard: true, dress: '#8a5f3e', hat: 'flat', hatColor: '#6b5a4a', glasses: true } },
      { id: 'pedro', name: 'Pedro', job: 'sit', hushed: true, at: { x: tree315.x + Math.sin(pd) * 1.2, z: tree315.z + Math.cos(pd) * 1.2, yaw: pd, seat: 0.5 }, look: { skin: SK[2], hair: '#d8d8d8', hairdo: 'bald', stache: true, dress: '#3f6f9a', hat: 'flat' } },
      { id: 'lola', name: 'Lola', job: 'chase', kid: 1, center: tree135, r: 2.6, lead: true, look: { skin: SK[4], hair: '#2e2420', hairdo: 'pigtails', dress: '#e86a9a', h: 0.74 } },
      { id: 'max', name: 'Max', job: 'chase', kid: 1, center: tree135, r: 2.6, lead: false, look: { skin: SK[0], hair: '#e0b060', dress: '#4f9a5a', legs: true, h: 0.72, hat: 'cap', hatColor: '#e0503f' } },
      { id: 'leo', name: 'Leo', job: 'walk', speed: 1.3, pause: 2.5, dog: true, path: [[-10.5, -111], [-10.5, -133.6], ring(100, 6.3), ring(150, 6.3), ring(180, 6.3), [-22, -147.6], [-46, -149.4]], look: { skin: SK[5], hair: '#3a2b26', dress: '#6b8fd1', legs: true, pants: '#4a3a33', h: 1.08 } },
      { id: 'ana', name: 'Ana', job: 'chat', at: { x: -6.9, z: -117.4 }, other: 'bea', look: { skin: SK[1], hair: '#8a4a2a', hairdo: 'bun', dress: '#4f8a4a', apron: '#fdf8ee' }, prop: 'basket' },
      { id: 'bea', name: 'Bea', job: 'chat', at: { x: -6.6, z: -115.9 }, other: 'ana', look: { skin: SK[3], hair: '#2e2420', hairdo: 'long', dress: '#b0563a', hat: 'straw' } },
      { id: 'emil', name: 'Emil', job: 'fish', at: { x: 2.1, z: -177.0, yaw: Math.PI / 2, seat: 0.3 }, bob: { x: 4.7, z: -176.8 }, look: { skin: SK[2], hair: '#6b3b25', beard: true, dress: '#e6b84a', legs: true, hat: 'straw' }, prop: 'rod' },
      { id: 'tito', name: 'Tito', job: 'guitar', at: { x: ring(55, 4.4)[0], z: ring(55, 4.4)[1], yaw: Math.atan2(Math.cos(55 * Math.PI / 180), Math.sin(55 * Math.PI / 180)) }, look: { skin: SK[6], hair: '#2e2420', stache: true, dress: '#c9553f', legs: true, pants: '#2f3440', hat: 'beret', hatColor: '#2f3440' }, prop: 'guitar', tipHat: true },
      { id: 'clara', name: 'Clara', job: 'walk', speed: 0.5, pause: 4, path: [[-11.3, -122.5], [-11.4, -132.6]], stoop: 0.18, look: { skin: SK[0], hair: '#f4f1ea', hairdo: 'bun', dress: '#7a5ab0', glasses: true, h: 0.92 }, prop: 'cane' },
      { id: 'rita', name: 'Rita', job: 'laundry', at: lau ? { x: lau.x + Math.cos(lau.ry) * 0.9, z: lau.z - Math.sin(lau.ry) * 0.9, yaw: lau.ry - Math.PI / 2 } : { x: -40, z: -160, yaw: 0 }, look: { skin: SK[4], hair: '#2e2420', hairdo: 'pony', dress: '#3e8f8a', apron: '#fdf8ee' }, prop: 'shirt' },
      { id: 'paula', name: 'Paula', job: 'walk', speed: 1.2, pause: 3, path: [[-48, -149.6], [-22.5, -147.3], ring(170, 6.3), ring(120, 6.3), ring(75, 6.6), ring(15, 6.3), [2.0, -145.6], [13, ez(13) - 1.0], [21, ez(21) - 1.0]], look: { skin: SK[7], hair: '#4a2f27', hairdo: 'long', dress: '#e0743c', hat: 'straw' }, prop: 'basket' },
      { id: 'marco', name: 'Marco', job: 'walk', speed: 1.1, pause: 4, path: [[3.2, ez(3.2) + 1.3], [31, ez(31) + 1.3]], look: { skin: SK[3], hair: '#2e2420', dress: '#8a5f3e', legs: true, hat: 'straw', stache: true, w: 1.1 }, prop: 'barrow' },
      { id: 'tomas', name: 'Tomás', job: 'walk', speed: 1.25, pause: 2.5, stopAll: true, path: [[-9.9, -109], [-9.9, -118.6], [-17, -119.3], [-24, -119.6], [-32.4, -121.6]], look: { skin: SK[1], hair: '#4a2f27', dress: '#3f6f9a', legs: true, pants: '#2f3440', hat: 'cap', hatColor: '#2f4a7a', bag: true }, prop: 'letter' },
      { id: 'nina', name: 'Nina', job: 'stand', hushed: true, at: { x: -12.6, z: -166.5, yaw: 1.2 }, look: { skin: SK[5], hair: '#6b3b25', hairdo: 'bun', dress: '#d97aa0', apron: '#fdf8ee' }, prop: 'basket' },
      { id: 'simon', name: 'Simón', job: 'stand', hushed: true, at: { x: 7.4, z: -173.4, yaw: Math.PI }, look: { skin: SK[2], hair: '#3a2b26', dress: '#4f8a4a', legs: true, hat: 'flat' } },
    ];
  }
  function moveTo(S, tx, tz, v, dt) {
    const dx = tx - S.x, dz = tz - S.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { S.speed = 0; return true; }
    const st = Math.min(d, v * dt); S.x += (dx / d) * st; S.z += (dz / d) * st; S.speed = v;
    S.yaw = dampAngle(S.yaw, Math.atan2(dx, dz), 7, dt);
    return d - st < 0.05;
  }
  function makeDynamic(root, out, gy) {
    const rig = Rig(), cast = castOf(out), people = [], byId = {}, R = rng(99);
    // ---------------- people
    for (const d of cast) {
      const Rr = makePerson(rig, { ...d.look, hushed: d.hushed, prop: d.prop, tipHat: d.tipHat });
      const S = { x: 0, z: 0, yaw: 0, speed: 0, phase: R() * 6, near: false, wave: 0, talk: 0, blink: 1 + R() * 4, seed: R(), i: 0, dir: 1, pause: R() * 2, hop: 0, sit: false, seat: 0.5, pose: null, lookAt: undefined };
      if (d.at) { S.x = d.at.x; S.z = d.at.z; S.yaw = d.at.yaw || 0; }
      if (d.path) { S.x = d.path[0][0]; S.z = d.path[0][1]; S.i = 1; }
      if (d.stops) { S.x = d.stops[0].x; S.z = d.stops[0].z; S.yaw = d.stops[0].yaw; }
      if (d.job === 'sit' || d.job === 'fish') { S.sit = true; S.seat = (d.at && d.at.seat) || 0.53; if (d.job === 'sit') { S.x += Math.sin(S.yaw) * 0.06; S.z += Math.cos(S.yaw) * 0.06; } }
      if (d.hushed) S.stare = (R() - 0.5) * 0.6;
      const h = (d.look.h || 1);
      const api = { id: d.id, name: d.name, kind: d.kid ? 'kid' : d.job, hushed: !!d.hushed, lines: d.hushed ? null : LINES[d.id] || null, talking: false,
        get x() { return S.x; }, get z() { return S.z; }, get y() { return GY + (S.sit ? S.seat - 0.5 : 0); }, top: h * 1.5 - (S.sit ? 0.45 : 0), _S: S, _R: Rr, _d: d };
      people.push(api); byId[d.id] = api;
      if (['keeper', 'chat', 'guitar', 'stand', 'laundry', 'fish'].includes(d.job)) out.colliders.push({ x: S.x, z: S.z, r: 0.4, npc: d.id });
    }
    const kids = { a: 0, b: -0.9, sgn: 1, flip: 9 };
    function think(p, dt, t, you) {
      const S = p._S, d = p._d;
      const dY = you ? Math.hypot(you.x - S.x, you.z - S.z) : 99, was = S.near;
      S.near = !d.hushed && (dY < (was ? 3.6 : 3.0) || p.talking);
      if (S.near && !was && !p.talking) S.wave = 1.2;
      const toYou = you ? Math.atan2(you.x - S.x, you.z - S.z) : S.yaw;
      S.lookAt = !d.hushed && dY < 6 ? toYou : undefined;
      S.speed = 0; S.pose = null; S.hop = 0; S.chatTalk = false;
      const face = (yaw, k = 5) => { S.yaw = dampAngle(S.yaw, yaw, k, dt); };
      switch (d.job) {
        case 'walk': {
          S.pose = d.prop === 'barrow' ? 'barrow' : d.prop === 'cane' ? 'cane' : d.prop === 'basket' ? 'basket' : null;
          if (S.near) { face(toYou); break; }
          if (S.pause > 0) { S.pause -= dt; if (d.stopAll && S.i !== 1) S.pose = 'deliver'; break; }
          const tg = d.path[S.i];
          if (moveTo(S, tg[0], tg[1], d.speed, dt)) {
            const end = S.i === 0 || S.i === d.path.length - 1;
            if (end || d.stopAll) S.pause = (d.pause || 2) * (0.6 + R() * 0.8);
            if (S.i === d.path.length - 1) S.dir = -1; else if (S.i === 0) S.dir = 1;
            S.i += S.dir;
          }
          break;
        }
        case 'sweep': {
          if (S.near) { face(toYou); break; }
          S.pose = 'sweep';
          const tg = S.dir > 0 ? d.path[1] : d.path[0];
          if (moveTo(S, tg[0], tg[1], 0.3, dt)) S.dir = -S.dir;
          face(-Math.PI / 2 + Math.sin(t * 0.3) * 0.4, 3); S.speed = 0.25;
          break;
        }
        case 'water': {
          const st = d.stops[S.i % d.stops.length];
          if (S.near) { face(toYou); break; }
          if (S.pause > 0) { S.pause -= dt; S.pose = 'pour'; face(st.yaw); break; }
          if (moveTo(S, st.x, st.z, 1.0, dt)) { S.pause = 5; if (d.stops.length > 1) { if (S.i >= d.stops.length - 1) S.dir = -1; else if (S.i <= 0) S.dir = 1; S.i += S.dir; } }
          break;
        }
        case 'keeper': {
          if (S.near) { face(toYou, 4); break; }
          face(d.at.yaw, 3);
          if (!d.hushed) { const c = (t * 0.11 + S.seed * 7) % 1; S.pose = c < 0.2 ? 'arrange' : null; if (c > 0.55 && c < 0.6) S.talkSolo = 1; }
          break;
        }
        case 'chat': {
          const o = byId[d.other]; if (!o) break;
          if (S.near || o._S.near) { face(toYou); break; }
          face(Math.atan2(o._S.x - S.x, o._S.z - S.z));
          const turn = Math.floor(t / 2.7 + (d.id === 'ana' ? 0 : 1)) % 2 === 0;
          S.chatTalk = turn; S.pose = 'chat'; S.nod = !turn && Math.sin(t * 0.9) > 0.3;
          break;
        }
        case 'sit': case 'fish': S.pose = d.job === 'fish' ? 'fish' : null; break;
        case 'guitar': S.pose = 'guitar'; if (S.near) face(toYou, 3); else face(d.at.yaw, 2); break;
        case 'laundry': if (S.near) { face(toYou); break; } face(d.at.yaw, 3); S.pose = (t * 0.25 + S.seed) % 1 < 0.55 ? 'pin' : 'pick'; break;
        case 'chase': {
          const c = d.center, a = d.lead ? kids.a : kids.b;
          if (kids.stop) { face(toYou); break; }
          const r = d.r + Math.sin(t * 1.7 + (d.lead ? 0 : 2)) * 0.25;
          const nx = c.x + Math.cos(a) * r, nz = c.z + Math.sin(a) * r;
          S.speed = Math.hypot(nx - S.x, nz - S.z) / Math.max(dt, 1e-3);
          if (S.speed > 0.05) face(Math.atan2(nx - S.x, nz - S.z), 12);
          S.x = nx; S.z = nz; S.speed = Math.min(S.speed, 3); S.pose = 'run'; S.hop = Math.abs(Math.sin(S.phase)) * 0.12;
          break;
        }
        default: break;   // stand
      }
    }
    function pose(p, dt, t) {
      const S = p._S, R = p._R, d = p._d, hush = d.hushed, P = R.props;
      const legsSeat = S.sit && R.legs ? 0.3 : 0;
      R.root.position.set(S.x, GY + (S.sit ? S.seat - legsSeat - 0.02 : 0), S.z); R.root.rotation.y = S.yaw;
      const walk = clamp(S.speed / 1.3, 0, 1.6);
      if (S.speed > 0.05) S.phase += dt * (3.0 + S.speed * 2.6); else S.phase = damp(S.phase, Math.round(S.phase / Math.PI) * Math.PI, 8, dt);
      const ph = S.phase, sw = Math.sin(ph);
      S.talkSolo = Math.max(0, (S.talkSolo || 0) - dt * 0.6);
      S.talk = damp(S.talk, p.talking || S.chatTalk || S.talkSolo > 0 ? 1 : 0, 10, dt);
      const br = hush ? 1 : 1 + Math.sin(t * 2.2 + S.seed * 9) * 0.014;
      R.body.scale.set(1, (S.sit ? 0.82 : 1) * br, 1);
      R.body.position.y = hush ? 0 : Math.abs(sw) * 0.05 * Math.min(walk, 1.2) + S.talk * Math.abs(Math.sin(t * 13)) * 0.03 + S.hop;
      R.body.rotation.z = hush ? 0 : sw * 0.05 * walk + Math.sin(t * 1.2 + S.seed * 9) * 0.02;
      R.body.rotation.x = (d.stoop || 0) + (S.pose === 'arrange' ? 0.22 : S.pose === 'pick' ? 0.35 : S.pose === 'sweep' ? 0.12 : S.pose === 'barrow' ? 0.15 : 0) + walk * 0.05;
      R.body.rotation.y = S.pose === 'sweep' ? Math.sin(t * 4.2) * 0.12 : S.pose === 'guitar' ? Math.sin(t * 2) * 0.06 : 0;
      if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = S.sit ? -1.25 : Math.sin(ph + i * Math.PI) * 0.6 * walk; });
      else R.feet.forEach((f, i) => { const s = i ? 1 : -1; if (S.sit) f.position.set(s * 0.13, -0.56, 0.36); else f.position.set(s * 0.13 * (d.look.w || 1), 0.04 + Math.max(0, Math.sin(ph + i * Math.PI)) * 0.06 * walk + (S.pose === 'guitar' && i === 0 ? Math.max(0, Math.sin(t * 8)) * 0.04 : 0), 0.12 + Math.sin(ph + i * Math.PI) * 0.13 * walk); });
      let aL = [-0.5 + sw * 0.5 * walk, 0, 0.2], aR = [-0.5 - sw * 0.5 * walk, 0, -0.2];
      if (hush) { aL = [-0.1, 0, 0.12]; aR = [-0.1, 0, -0.12]; if (d.prop === 'basket') aL = [-0.4, 0, 0.1]; }
      else switch (S.pose) {
        case 'sweep': { const s = Math.sin(t * 4.2); aL = [-0.95, 0, 0.35 + s * 0.15]; aR = [-0.75, 0, -0.3 + s * 0.15]; if (P.broom) P.broom.rotation.set(0.35, 0, s * 0.45); break; }
        case 'pour': aR = [-1.3, 0, -0.1]; break;
        case 'arrange': { const s = Math.sin(t * 3); aL = [-1.15 + s * 0.15, 0, 0.25]; aR = [-1.15 - s * 0.15, 0, -0.25]; break; }
        case 'guitar': aL = [-1.25, 0.3, 0.8]; aR = [-0.8 + Math.sin(t * 13) * 0.16, 0, -0.5]; break;
        case 'fish': aL = [-1.1, 0, 0.3]; aR = [-1.05 + Math.sin(t * 0.7) * 0.05, 0, -0.3]; break;
        case 'pin': aL = [-2.75, 0, 0.3]; aR = [-2.75 + Math.sin(t * 6) * 0.1, 0, -0.3]; break;
        case 'pick': aL = [-0.95, 0, 0.1]; aR = [-0.95, 0, -0.1]; break;
        case 'barrow': aL = [-0.7, 0, 0.1]; aR = [-0.7, 0, -0.1]; break;
        case 'cane': aR = [-0.45 + sw * 0.15 * walk, 0, -0.15]; break;
        case 'basket': aL = [-0.35, 0, 0.15]; break;
        case 'chat': if (S.chatTalk) aR = [-1.0 + Math.sin(t * 5) * 0.25, 0, -0.35 - Math.sin(t * 2.5) * 0.25]; break;
        case 'deliver': aR = [-1.35, 0, -0.1]; break;
        case 'run': aL = [-0.4 + sw * 0.9, 0, 0.6]; aR = [-0.4 - sw * 0.9, 0, -0.6]; break;
      }
      if (S.sit && !S.pose && !hush) { aL = [-0.75, 0, 0.3]; aR = [-0.75, 0, -0.3]; }
      if (S.wave > 0 && !hush) { S.wave -= dt; if (S.pose !== 'guitar' && S.pose !== 'barrow') aR = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35]; }
      R.arms[0].rotation.set(...aL); R.arms[1].rotation.set(...aR);
      if (P.can) P.can.rotation.x = S.pose === 'pour' ? 1.2 : 0;
      if (P.shirt) P.shirt.visible = true, P.shirt.scale.setScalar(S.pose === 'pin' ? 1 : 0.001);
      if (P.letter) P.letter.scale.setScalar(S.pose === 'deliver' ? 1 : 0.001);
      // the head: looks at you when you're close, else idles about; the hushed stare at nothing
      let hy, hx = 0;
      if (hush) { hy = S.stare; hx = 0.2; }
      else if (S.lookAt !== undefined) { hy = clamp(angDiff(S.yaw + R.body.rotation.y, S.lookAt), -1.2, 1.2); hx = -0.05; }
      else hy = S.pose === 'guitar' ? Math.sin(t * 0.5) * 0.3 : Math.sin(t * 0.37 + S.seed * 20) * (S.speed > 0.1 ? 0.15 : 0.55);
      if (S.pose === 'guitar') hx += Math.sin(t * 8) * 0.07;
      if (S.nod) hx += Math.max(0, Math.sin(t * 6)) * 0.12;
      if (S.pose === 'fish' || S.pose === 'pour') hx += 0.25;
      R.head.rotation.y = damp(R.head.rotation.y, hy, 5, dt); R.head.rotation.x = damp(R.head.rotation.x, hx, 6, dt);
      if (!hush && (S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + R0() * 3.5; }
      const bl = !hush && S.blink < 0 ? 0.12 : 1;
      R.eyes.forEach(e => { e.scale.y = bl; });
      R.mouth.scale.y = S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : 0.012;
      R.root.updateMatrixWorld(true);
    }

    // ---------------- animals: Pipa (Leo's dog), two cats, pigeons in the plaza, ducks on the pond
    const dog = { A: makeAnimal(rig, 'dog', '#d9a066'), x: -10.5, z: -109.5, yaw: Math.PI, speed: 0, ph: 0 };
    const cats = out.cats.map((c, i) => ({ A: makeAnimal(rig, 'cat', i ? '#8a8a96' : '#e8a050'), ...c }));
    cats.forEach(c => c.A.legs.forEach(e => e.scale.y = c.sleep ? 0.004 : 0.022));
    const pigeons = [];
    for (let i = 0; i < 6; i++) { const a = 2.2 + i * 0.35, r = 6.8 + (i % 3) * 0.5; pigeons.push({ A: makeAnimal(rig, 'pigeon', '#a9adb8'), x: PLAZA.x + Math.cos(a) * r, z: PLAZA.z + Math.sin(a) * r, yaw: R() * TAU, y: 0, mode: 'walk', t: R() * 2, fx: 0, fz: 0, tx: 0, tz: 0, ft: 0 }); }
    const pond = out.pond;
    const ducks = [['#fdf8ee', pond.A, 2.2, 0.35], ['#9a7a5a', pond.A, 1.4, -0.5], ['#fdf8ee', pond.B, 1.6, 0.42]].map(([c, L, r, w], i) => ({ A: makeAnimal(rig, 'duck', c), L, r, w, a: i * 2.1 }));
    // the fisher's line and bobber
    const emil = byId.emil, bob = emil && emil._d.bob;
    const line = bob ? rig.leaf(new THREE.Object3D(), 'cyl', '#f4efe4', null, [0.006, 1, 0.006]) : null;
    const bobber = bob ? rig.node(null || new THREE.Object3D(), [bob.x, GY + 0.1, bob.z]) : null;
    if (bobber) { rig.leaf(bobber, 'ball', '#e0503f', [0, 0, 0], [0.06, 0.05, 0.06]); rig.leaf(bobber, 'ball', '#fdf8ee', [0, 0.04, 0], [0.05, 0.03, 0.05]); }
    // the bell in the tower, swinging gently
    const bell = new THREE.Object3D(); bell.position.copy(out.bellAt);
    rig.leaf(bell, 'cone', '#e6b84a', [0, -0.45, 0], [0.62, 0.75, 0.62]); rig.leaf(bell, 'cap', '#e6b84a', [0, -0.12, 0], [0.32, 0.3, 0.32]); rig.leaf(bell, 'ball', '#c99a3a', [0, -0.85, 0], [0.12, 0.12, 0.12]); rig.leaf(bell, 'cyl', '#4a3a33', [0, 0.12, 0], [0.5, 0.08, 0.08], [0, 0, Math.PI / 2]);
    const animals = [dog.A, ...cats.map(c => c.A), ...pigeons.map(p => p.A), ...ducks.map(d => d.A)];

    const folks = rig.meshes(root);

    // ---------------- chimney smoke: puffs with ink outlines
    const SMOKE_N = 4, spots = out.smoke.map((p, i) => ({ p, big: false, seed: R() }));
    const bakeryAt = new THREE.Vector3(LM.bakery.x, 0, LM.bakery.z);
    spots.forEach(s => { s.big = Math.hypot(s.p.x - bakeryAt.x, s.p.z - bakeryAt.z) < 7; });
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const smoke = new THREE.InstancedMesh(puffGeo, toonM({ rim: 0.25, color: '#f4f2ee' }), Math.max(1, spots.length * SMOKE_N));
    const smokeInk = new THREE.InstancedMesh(puffGeo, inkM({ off: 0.06 }), smoke.count); smokeInk.instanceMatrix = smoke.instanceMatrix;
    smoke.frustumCulled = smokeInk.frustumCulled = false; smoke.name = 'town-smoke'; root.add(smoke, smokeInk);
    // ---------------- fountain water: drops arcing from the top into the bowl, and from the bowl into the basin; drops from Lena's can
    const DROPS = 40, CAN = 14;
    const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), toonM({ rim: 0.5, color: '#bfeaf6' }), DROPS + CAN);
    drops.frustumCulled = false; drops.name = 'town-drops'; root.add(drops);
    const canDrops = Array.from({ length: CAN }, () => ({ life: 0, x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0 }));
    let canNext = 0;
    // ---------------- the town's name over the south gate (zh / ja: 阿尔巴 / アルバ, CJK.md, in the mode; repainted by signs.js
    // SIGNS.board when the language or mode changes)
    const GATE_NAME = { zh: '[阿尔巴|Ā ěr bā]', ja: 'アルバ' };
    const paintGate = (c, W, H, l) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#8a5f3e'; roundRect(c, 4, 4, W - 8, H - 8, 26); c.fill();
      c.fillStyle = '#efd9aa'; roundRect(c, 16, 16, W - 32, H - 32, 18); c.fill();
      c.strokeStyle = '#c99a5a'; c.lineWidth = 4; roundRect(c, 28, 28, W - 56, H - 56, 12); c.stroke();
      for (const [x, y, col] of [[52, 52, '#e0503f'], [W - 52, 52, '#f2c14e'], [52, H - 52, '#3f7fc9'], [W - 52, H - 52, '#e86a9a']]) { c.fillStyle = col; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 0, TAU); c.fill(); } c.fillStyle = '#fff4c0'; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill(); }
      const cj = (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined', name = cj ? CJK.plain(GATE_NAME[l], { lang: l }) : 'ALBA';
      let px = 92; c.font = `900 ${px}px "Trebuchet MS", Bahnschrift, "Segoe UI", sans-serif`;
      while (cj && px > 34 && c.measureText(name).width > W - 150) { px -= 2; c.font = `900 ${px}px "Trebuchet MS", Bahnschrift, "Segoe UI", sans-serif`; }
      c.fillStyle = '#5b3a22'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, W / 2, H / 2 + 6);
    };
    const signTex = TK.canvasTex(512, 160, (c, W, H) => paintGate(c, W, H, 'es'));
    if (typeof SIGNS !== 'undefined' && SIGNS.board) {
      SIGNS.board(l => { const cv = signTex.image; paintGate(cv.getContext('2d'), cv.width, cv.height, l); signTex.needsUpdate = true; });
      SIGNS.add({ id: 'alba.gate', x: out.gateSign.at.x, z: out.gateSign.at.z, r: 3.0, when: () => (UI.lang === 'zh' || UI.lang === 'ja'),
        card: l => ({ tag: 'The sign over Alba’s gate', lines: [{ text: GATE_NAME[l] || 'Alba', en: 'Alba, Noa’s village' }] }) });
    }
    const signMat = new THREE.MeshToonMaterial({ map: signTex, gradientMap: TK.grad }), edge = toonM({ color: '#8a5f3e' });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.03, 0.14), [edge, edge, edge, edge, signMat, signMat]);
    sign.position.copy(out.gateSign.at); sign.castShadow = true; sign.name = 'town-gate-sign'; root.add(sign);
    const signInk = new THREE.Mesh(new THREE.BoxGeometry(3.36, 1.09, 0.2), inkM({})); signInk.position.copy(sign.position); root.add(signInk);
    // ---------------- the plaza's signpost (drawProps: out.signpost): each arm's name in the language on both faces, its
    // picture by the post, painted by signs.js (again when the language changes), with the arms' dithered fade; E «Read»
    if (out.signpost && typeof SIGNS !== 'undefined') {
      const WORDS = { bakery: { es: 'Panadería', pt: 'Padaria', de: 'Bäckerei', en: 'bakery', zh: '[面包店|miàn bāo diàn]', ja: 'パン[屋|や]' },
        bell: { es: 'Campanario', pt: 'Campanário', de: 'Glockenturm', en: 'bell tower', zh: '[钟楼|zhōng lóu]', ja: '[鐘楼|しょうろう]' },
        stall: { es: 'Frutería', pt: 'Frutaria', de: 'Obststand', en: 'fruit stall', zh: '[水果摊|shuǐ guǒ tān]', ja: '[果物屋|くだものや]' },
        gate: { es: 'Puerta este', pt: 'Portão leste', de: 'Osttor', en: 'east gate', zh: '[东门|dōng mén]', ja: '[東門|ひがしもん]' } };
      // (zh / ja: CJK.md notation; signs.js paints it as plain text in the mode and reads it with its readings; never Spanish)
      const SP = out.signpost, pw = SP.len - 0.08, ph = SP.h - 0.05, geo = new THREE.PlaneGeometry(pw, ph), word = (a, l) => pickLang(WORDS[a.key], l, WORDS[a.key].en);
      for (const a of SP.arms) for (const s of [1, -1]) {
        const cv = document.createElement('canvas'); cv.width = 640; cv.height = Math.round(640 * ph / pw);
        const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
        const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad }); mat.onBeforeCompile = patch({ fade: true }); mat.customProgramCacheKey = () => 'town-signpost';
        const nx = Math.cos(a.A) * s, nz = -Math.sin(a.A) * s, mid = SP.len / 2 + 0.05, off = SP.t / 2 + 0.004;     // (n: this face's normal)
        const m = new THREE.Mesh(geo, mat); m.name = 'town-signpost-' + a.key;
        m.position.set(SP.x + Math.sin(a.A) * mid + nx * off, GY + a.y, SP.z + Math.cos(a.A) * mid + nz * off); m.rotation.y = Math.atan2(nx, nz); root.add(m);
        // (on the face with s = 1 the post is on your right, so its picture goes there)
        SIGNS.board(l => { SIGNS.paint(cv.getContext('2d'), cv.width, cv.height, { text: word(a, l).toUpperCase(), edge: a.color, icon: a.icon, iconSide: s > 0 ? 'R' : 'L' }); tex.needsUpdate = true; });
      }
      SIGNS.add({ id: 'alba.signpost', x: SP.x, z: SP.z, r: 2.3, card: l => ({ tag: 'The signpost in the plaza', lines: SP.arms.map(a => ({ text: word(a, l), en: WORDS[a.key].en, look: { edge: a.color } })) }) });
    }
    // ---------------- Rosa's basket of apples (a story object: hide or move it as the story needs)
    const basket = new THREE.Group(); basket.name = 'town-basket';
    {
      const kb = Kit(); kb.frame(0, 0, 0, 0);
      kb.cyl(0, 0, 0, 0.4, 0.42, '#b8854a', { geo: GEO.cyl20 }).cyl(0, 0.38, 0, 0.43, 0.06, '#9a6a3a', { geo: GEO.cyl20 });
      for (let i = 0; i < 3; i++) kb.cyl(0, 0.08 + i * 0.12, 0, 0.405, 0.03, '#d9a866', { geo: GEO.cyl20, ink: 0 });
      [[0, 0.5, 0], [0.18, 0.47, 0.12], [-0.17, 0.47, 0.1], [0.05, 0.47, -0.18], [-0.1, 0.6, -0.02], [0.14, 0.58, -0.06]].forEach(([x, y, z], i) => kb.ball(x, y, z, 0.13, i === 4 ? '#9cc24e' : '#e2453a', { ink: 0.012 }));
      kb.beam(-0.38, 0.4, 0, 0, 0.85, 0, 0.035, '#9a6a3a', { geo: GEO.cyl6 }).beam(0, 0.85, 0, 0.38, 0.4, 0, 0.035, '#9a6a3a', { geo: GEO.cyl6 });
      const m = new THREE.Mesh(bake(kb.B.solid), toonM({ vc: true, rim: 0.3 })); m.castShadow = true;
      basket.add(m, new THREE.Mesh(bake(kb.B.solid, { hull: true }), inkM({})));
      basket.position.set(LM.basket.x, GY, LM.basket.z); root.add(basket);
      out.colliders.push({ x: LM.basket.x, z: LM.basket.z, r: 0.45 });
    }

    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), E = new THREE.Euler(), UP = new THREE.Vector3(0, 1, 0);
    function update(dt, t, you) {
      // people
      kids.stop = !!you && people.some(p => p._d.job === 'chase' && (p._S.near || p.talking));
      if (!kids.stop) { kids.a += dt * 1.0 * kids.sgn; kids.b += dt * 1.0 * kids.sgn; if ((kids.flip -= dt) < 0) { kids.flip = 7 + R() * 5; kids.sgn = -kids.sgn; } }
      for (const p of people) { think(p, dt, t, you); pose(p, dt, t); }
      // Pipa trots after Leo, sits when he stops, wags at you
      {
        const L = byId.leo._S, fx = Math.sin(L.yaw), fz = Math.cos(L.yaw);
        const tx = L.x - fx * 1.1 + fz * 0.45, tz = L.z - fz * 1.1 - fx * 0.45, dx = tx - dog.x, dz = tz - dog.z, dd = Math.hypot(dx, dz);
        const nearYou = you && Math.hypot(you.x - dog.x, you.z - dog.z) < 3;
        dog.speed = dd > 0.3 ? Math.min(3.2, dd * 2.4) : 0;
        if (dog.speed > 0) { dog.x += (dx / dd) * dog.speed * dt; dog.z += (dz / dd) * dog.speed * dt; dog.yaw = dampAngle(dog.yaw, Math.atan2(dx, dz), 8, dt); dog.ph += dt * (6 + dog.speed * 3); }
        else dog.yaw = dampAngle(dog.yaw, nearYou ? Math.atan2(you.x - dog.x, you.z - dog.z) : L.yaw, 4, dt);
        const A = dog.A, mv = Math.min(1, dog.speed / 1.5);
        A.root.position.set(dog.x, GY, dog.z); A.root.rotation.y = dog.yaw;
        A.body.position.y = Math.abs(Math.sin(dog.ph)) * 0.05 * mv; A.body.rotation.x = damp(A.body.rotation.x, mv > 0.05 ? 0 : -0.32, 6, dt);
        A.legs.forEach((l, i) => { l.rotation.x = Math.sin(dog.ph + (i % 2 ? 0 : Math.PI) + (i > 1 ? Math.PI : 0)) * 0.6 * mv + (mv < 0.05 && i > 1 ? 1.1 : 0); });
        A.tail.rotation.z = Math.sin(t * (nearYou ? 18 : 9)) * (nearYou ? 0.8 : 0.45);
        A.head.rotation.x = mv < 0.05 ? 0.25 : 0; A.head.rotation.z = nearYou ? Math.sin(t * 2) * 0.2 : 0;
        A.root.updateMatrixWorld(true);
      }
      cats.forEach((c, i) => {
        const A = c.A; A.root.position.set(c.x, c.y, c.z); A.root.rotation.y = c.yaw;
        const near = you && Math.hypot(you.x - c.x, you.z - c.z) < 3;
        if (c.sleep) { A.body.scale.set(1, 1 + Math.sin(t * 1.6 + i) * 0.05, 1); A.tail.rotation.y = Math.sin(t * 0.7) * 0.15; A.head.rotation.set(0.35, 0.5, 0.3); }
        else { A.body.rotation.x = -0.75; A.body.position.y = 0.12; A.head.rotation.x = 0.7; A.head.rotation.y = near ? clamp(angDiff(c.yaw, Math.atan2(you.x - c.x, you.z - c.z)), -1, 1) : Math.sin(t * 0.6) * 0.6; A.tail.rotation.y = Math.sin(t * 2.2) * 0.6; }
        A.root.updateMatrixWorld(true);
      });
      pigeons.forEach((g, i) => {
        const A = g.A, near = you && Math.hypot(you.x - g.x, you.z - g.z) < 2.3;
        if (g.mode !== 'fly' && near) { const a = R() * TAU, r = 5 + R() * 4; g.mode = 'fly'; g.ft = 0; g.fx = g.x; g.fz = g.z; g.tx = PLAZA.x + Math.cos(a) * r; g.tz = PLAZA.z + Math.sin(a) * r; }
        if (g.mode === 'fly') {
          g.ft += dt / 1.6; const k = Math.min(1, g.ft);
          g.x = lerp(g.fx, g.tx, k); g.z = lerp(g.fz, g.tz, k); g.y = Math.sin(k * Math.PI) * 2.6; g.yaw = Math.atan2(g.tx - g.fx, g.tz - g.fz);
          A.wings.forEach((w, s) => { w.rotation.z = (s ? -1 : 1) * (0.4 + Math.sin(t * 30) * 0.9); });
          if (k >= 1) { g.mode = 'walk'; g.t = 1; g.y = 0; }
        } else {
          A.wings.forEach(w => { w.rotation.z = 0; });
          if ((g.t -= dt) < 0) { g.t = 0.6 + R() * 1.6; g.mode = R() < 0.5 ? 'peck' : 'walk'; g.yaw += (R() - 0.5) * 2.4; }
          if (g.mode === 'walk') { const nx = g.x + Math.sin(g.yaw) * dt * 0.5, nz = g.z + Math.cos(g.yaw) * dt * 0.5; if (Math.hypot(nx - PLAZA.x, nz - PLAZA.z) > 3.4 && Math.hypot(nx - PLAZA.x, nz - PLAZA.z) < 11) { g.x = nx; g.z = nz; } else g.yaw += Math.PI * 0.7; }
        }
        A.root.position.set(g.x, GY + g.y, g.z); A.root.rotation.y = g.yaw;
        A.body.position.y = g.mode === 'walk' ? Math.abs(Math.sin(t * 14 + i)) * 0.02 : 0;
        A.head.rotation.x = g.mode === 'peck' ? Math.max(0, Math.sin(t * 9 + i)) * 0.9 : 0; A.head.position.z = 0.08 + (g.mode === 'walk' ? Math.sin(t * 14 + i) * 0.015 : 0);
        A.root.updateMatrixWorld(true);
      });
      ducks.forEach((d, i) => {
        d.a += dt * d.w * 0.6 / Math.max(0.6, d.r);
        const x = d.L.x + Math.cos(d.a) * d.r, z = d.L.z + Math.sin(d.a) * d.r, A = d.A;
        A.root.position.set(x, GY + 0.07 + Math.sin(t * 2 + i) * 0.015, z); A.root.rotation.y = Math.atan2(-Math.sin(d.a) * Math.sign(d.w), Math.cos(d.a) * Math.sign(d.w));
        A.head.rotation.x = Math.sin(t * 0.5 + i * 2) > 0.92 ? 1.2 : 0; A.root.updateMatrixWorld(true);
      });
      // the fisher's line, from the rod's tip to the bobber
      if (line && emil) {
        const tip = V.set(0, 1.85, 0).applyMatrix4(emil._R.props.rod.matrixWorld);
        bobber.position.y = GY + 0.09 + Math.sin(t * 2.3) * 0.015 + (Math.sin(t * 0.37) > 0.97 ? -0.05 : 0); bobber.updateMatrixWorld(true);
        const dx = bobber.position.x - tip.x, dy = bobber.position.y - tip.y, dz = bobber.position.z - tip.z, L = Math.hypot(dx, dy, dz);
        line.position.set((tip.x + bobber.position.x) / 2, (tip.y + bobber.position.y) / 2, (tip.z + bobber.position.z) / 2);
        line.quaternion.setFromUnitVectors(UP, SC.set(dx / L, dy / L, dz / L)); line.scale.set(0.006, L, 0.006); line.updateMatrixWorld(true);
      }
      bell.rotation.z = Math.sin(t * 1.3) * 0.05; bell.updateMatrixWorld(true);
      folks.sync();
      // smoke
      let n = 0;
      for (const s of spots) for (let j = 0; j < SMOKE_N; j++) {
        const per = s.big ? 2.4 : 3.4, u = (t / per + j / SMOKE_N + s.seed) % 1, k = s.big ? 1.4 : 1;
        const sz = (0.26 + u * 0.7) * Math.min(1, u * 5) * (1 - Math.pow(u, 3)) * k * (0.8 + 0.4 * ((j * 0.618 + s.seed * 3) % 1));
        V.set(s.p.x + u * 1.4 + (j % 2 ? 1 : -1) * 0.22 * u + Math.sin(u * 5 + s.seed * 9) * 0.2, s.p.y + 0.1 + u * 2.6 * k, s.p.z + u * 0.6 + (j % 2 ? -1 : 1) * 0.15 * u);
        M.compose(V, Q.identity(), SC.set(sz, sz * 0.9, sz)); smoke.setMatrixAt(n++, M);
      }
      smoke.instanceMatrix.needsUpdate = true;
      // fountain drops
      const F = out.fountainAt;
      for (let i = 0; i < DROPS; i++) {
        const tier = i < 20 ? 0 : 1, a = ((i % 10) / 10) * TAU + tier * 0.3, u = (t * (tier ? 0.8 : 1.1) + i * 0.37) % 1;
        const r = tier ? 1.22 + u * 0.8 : u * 1.05, y = tier ? 1.5 + u * 0.05 - u * u * 1.08 : 2.34 + u * 0.55 - u * u * 1.4;
        V.set(F.x + Math.cos(a) * r, F.y + y, F.z + Math.sin(a) * r);
        M.compose(V, Q.identity(), SC.set(0.045, 0.075, 0.045)); drops.setMatrixAt(i, M);
      }
      // Lena's watering can
      const lena = byId.lena;
      if (lena && lena._S.pose === 'pour' && (canNext -= dt) < 0) {
        canNext = 0.07; const c = canDrops.find(q => q.life <= 0);
        if (c) { const sp = V.set(0, 0.06, 0.32).applyMatrix4(lena._R.props.can.children[1] ? lena._R.props.can.matrixWorld : lena._R.props.can.matrixWorld); Object.assign(c, { life: 0.7, x: sp.x, y: sp.y, z: sp.z, vx: Math.sin(lena._S.yaw) * 0.6, vy: -0.2, vz: Math.cos(lena._S.yaw) * 0.6 }); }
      }
      canDrops.forEach((c, i) => {
        if (c.life > 0) { c.life -= dt; c.vy -= 9 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; if (c.y < GY + 0.3) c.life = 0; }
        M.compose(V.set(c.x, c.life > 0 ? c.y : -50, c.z), Q.identity(), SC.set(0.04, 0.07, 0.04)); drops.setMatrixAt(DROPS + i, M);
      });
      drops.instanceMatrix.needsUpdate = true;
    }
    return { people, update, objects: { basket, bell, sign, dog, cats, pigeons, ducks, folks: folks.list.map(l => l.im) } };
  }

  // ------------------------------------------------------------ the ground: cobbled streets and plaza, packed-earth lanes
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  let TEX = null;
  function textures() {
    if (TEX) return TEX;
    const cobble = TK.canvasTex(256, 256, (c, W, H) => {
      c.fillStyle = '#9c8a70'; c.fillRect(0, 0, W, H);
      const R = rng(9), rows = 8, rh = H / rows;
      for (let r = 0; r < rows; r++) {
        let x = (r % 2) * -rh * 0.55;
        while (x < W) {
          const w = rh * (0.85 + R() * 0.75), v = 0.88 + R() * 0.16, warm = R() * 10;
          for (const ox of [0, -W, W]) {
            c.fillStyle = `rgb(${(236 + warm) * v | 0},${224 * v | 0},${(198 - warm) * v | 0})`; roundRect(c, x + ox + 2.5, r * rh + 2.5, w - 5, rh - 5, 8); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.2)'; roundRect(c, x + ox + 6, r * rh + 5, w - 14, (rh - 10) * 0.38, 5); c.fill();
          }
          x += w;
        }
      }
    });
    const earth = TK.canvasTex(128, 128, (c, W, H) => {
      c.fillStyle = '#e6d3ae'; c.fillRect(0, 0, W, H);
      const R = rng(4);
      for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, r = 1.2 + R() * 3; c.fillStyle = R() < 0.5 ? 'rgba(150,120,80,0.35)' : 'rgba(255,250,235,0.45)'; for (const ox of [0, -W, W]) for (const oy of [0, -H, H]) { c.beginPath(); c.ellipse(x + ox, y + oy, r * 1.4, r, R() * 3, 0, TAU); c.fill(); } }
    });
    for (const t of [cobble, earth]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
    return (TEX = { cobble, earth });
  }
  function drawGround(k) {
    k.frame(0, GY, 0, 0);
    STREETS.forEach((s, si) => {
      // (the earth lanes lie under the cobbles, so a lane's round end doesn't sit on the street like a patch of old path: playtest 4)
      const b = s.lane ? 'earth' : 'cobble', col = s.lane ? '#f2e2c4' : '#ffffff', y = s.lane ? 0.003 + si * 0.0005 : 0.014 + si * 0.0015;
      for (let i = 0; i < s.pts.length - 1; i++) {
        const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
        k.box((ax + bx) / 2, y, (az + bz) / 2, s.w, 0.02, L, col, { b, ry });
        if (!s.lane) for (const sd of [-1, 1]) k.box((ax + bx) / 2 + Math.cos(ry) * sd * (s.w / 2 + 0.05), y + 0.01, (az + bz) / 2 - Math.sin(ry) * sd * (s.w / 2 + 0.05), 0.3, 0.05, L, '#c9b48e', { b, ry });
      }
      for (const [x, z] of s.pts) k.add(GEO.disc, x, y + 0.004, z, s.w / 2, 1, s.w / 2, col, { b });
    });
    for (const c of PAVED) {
      if (c.kind === 'plaza') {
        k.add(GEO.disc64, c.x, 0.03, c.z, c.r, 1, c.r, '#fff8ec', { b: 'cobble' });
        k.add(GEO.ring(0.93), c.x, 0.036, c.z, c.r, 1, c.r, '#d9c39c', { b: 'cobble' });
        k.add(GEO.ring(0.9), c.x, 0.036, c.z, 6.4, 1, 6.4, '#e9b08a', { b: 'cobble' });
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.add(GEO.cone4, c.x + Math.sin(a) * 4.3, 0.032, c.z + Math.cos(a) * 4.3, 0.55, 0.02, 1.5, i % 2 ? '#d9c39c' : '#e9b08a', { b: 'cobble', ry: a, rx: 0 }); }
      } else if (c.kind === 'dirt') k.add(GEO.disc, c.x, 0.02, c.z, c.r, 1, c.r, '#f2e2c4', { b: 'earth' });
      else k.add(GEO.disc, c.x, 0.026, c.z, c.r, 1, c.r, '#f4ead8', { b: 'cobble' });
    }
    for (const r of DIRT) k.box(r.x, 0.022, r.z, r.hw * 2, 0.02, r.hd * 2, '#ecd6ae', { b: 'earth' });
    // footpaths: a strip of earth with stepping stones
    const R = rng(31);
    for (const [[ax, az], [bx, bz]] of PATHS) {
      const L = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az);
      k.box((ax + bx) / 2, 0.016, (az + bz) / 2, 1.3, 0.02, L + 0.6, '#f4e6cc', { b: 'earth', ry });
      for (let t = 0.3; t < L; t += 0.75) k.add(GEO.disc, ax + (bx - ax) * t / L + (R() - 0.5) * 0.2, 0.03, az + (bz - az) * t / L + (R() - 0.5) * 0.2, 0.3 + R() * 0.08, 1, 0.24 + R() * 0.06, '#e8e0d0', { b: 'cobble', ry: R() * 3 });
    }
  }

  // ------------------------------------------------------------ build it
  function build(scene, env = {}) {
    const ground = env.terrainAt || (() => GY);
    const gy = (x, z) => ground(x, z);
    const root = new THREE.Group(); root.name = 'town'; scene.add(root);
    const k = Kit(), out = { smoke: [], colliders: [], platforms: [], dyn: {} };
    const col = out.colliders;
    // houses (and their colliders)
    for (const h of HOUSES) {
      const y0 = Math.min(...corners({ x: h.x, z: h.z, hw: h.w / 2, hd: h.d / 2, rot: h.rot }).map(([x, z]) => gy(x, z)), gy(h.x, h.z));
      drawHouse(k, h, y0, out);
      col.push({ obox: 1, x: h.x, z: h.z, hw: h.w / 2 + 0.12, hd: h.d / 2 + 0.12, rot: h.rot });
    }
    drawLandmarks(k, out, gy);
    drawGround(k);
    // bake the buckets into a handful of meshes
    const tex = textures();
    const meshes = {};
    const add = (name, geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.name = 'town-' + name; m.castShadow = !!o.cast; m.receiveShadow = o.receive !== false; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); meshes[name] = m; return m; };
    if (k.B.solid.length) { add('solid', bake(k.B.solid), toonM({ vc: true, rim: 0.15, fade: true }), { cast: true }); add('solidInk', bake(k.B.solid, { hull: true }), inkM({ fade: true }), { receive: false }); }
    if (k.B.sway.length) { add('sway', bake(k.B.sway), toonM({ vc: true, rim: 0.22, fade: true, sway: true }), { cast: true }); add('swayInk', bake(k.B.sway, { hull: true }), inkM({ fade: true, sway: true }), { receive: false }); }
    if (k.B.cobble.length) add('cobble', bake(k.B.cobble, { uv: 0.33 }), toonM({ vc: true, map: tex.cobble, poly: 2 }));
    if (k.B.earth.length) add('earth', bake(k.B.earth, { uv: 0.25 }), toonM({ vc: true, map: tex.earth, poly: 1 }));
    if (k.B.water.length) add('water', bake(k.B.water), waterMat(), { receive: false });
    const dyn = makeDynamic(root, out, gy);
    // @@BUILD@@
    const landmarks = {};
    for (const [key, p] of Object.entries(LM)) landmarks[key] = { x: p.x, z: p.z };
    let last = 0;
    function update(dt, t, you) {
      U.uTime.value = t;
      if (you) U.uFocus.value.set(you.x, (you.y !== undefined ? you.y : gy(you.x, you.z)) + 1.0, you.z); else U.uFocus.value.set(0, -1e4, 0);
      dyn.update(dt, t, you);
      last = t;
    }
    return {
      colliders: col, update, people: dyn.people, landmarks, platforms: out.platforms, group: root, meshes, objects: dyn.objects,
      pavedAt, layout: LAYOUT, setFade(on) { U.uFade.value = on ? 1 : 0; },
      // (someone's hair, for the story: hair('hugo', k, q), see hairAt)
      hair(id, k, q = 0) { const p = dyn.people.find(o => o.id === id); if (p) hairAt(p._R, k, q); },
      stats() { let tris = 0; root.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); } }); return { tris: Math.round(tris), houses: HOUSES.length }; },
    };
  }
  return { build, layout: LAYOUT, pavedAt, landmarks: LM, GY };
})();
