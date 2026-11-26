'use strict';
// The Past («el Ayer»), Chapter 2's first time realm (DESIGN.md 13.2, 17.2b; game/REGIONS.md). Through the tear in the Old
// Tower's door you land in Alba long ago, on the day of the last Festival of Voices. Text: past_text.js (PTXT); the scenes, the
// tasks and the fight: past_scenes.js (PAST_SC); the songs: past_music.js.
//   It's a room in main.js's sense (PAST.inside: the present's people, side modules and Talk prompts all stand aside), but
//   it's Alba itself, re-dressed: warm light that moves from dawn to night with the story, a sky of its own, bunting and
//   lanterns round the plaza, the bells shining like new, the people of then (the story's own are parked away), and the Old
//   Quarter in cemetery.js's past era (the theater open, its people alive). The memory ends at Alba's edges: past them, Noa
//   calls you back. A small tear by the bell tower leads home to the present (the tower's landing); the tower's tear leads back.
//   PAST.init(game) · fromTower() · leave() · update(dt, t) (main.js, while inside) · late(dt) (main.js, every frame, before
//   the render) · interactables() · target() · song() · areaAt(x, z) · inside · OUTSIDE
// Flags: pastIn, pastBell, pastApples, pastEcho, pastNames, pastElio, pastScene, pastBoss, pastReport, pastDone. Progress:
// state.past ({ inside, apples: {}, scene: {}, grades: {} }).
const PAST = (() => {
  let G = null, built = false, inside = false, busyNow = false;
  const W = { people: {} };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.past || (G.state.past = {});
  const F = () => G.state.flags;
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const OFF = 1e5;
  const INK = '#2b2235';
  const gy = (x, z) => WORLD.terrainAt(x, z);

  // ------------------------------------------------------------ places
  const TL = () => (typeof TOWN !== 'undefined' && TOWN.landmarks) || {};
  const SP = {
    arrive: { x: -24.6, z: -157.4, yaw: Math.PI },          // Bruno's yard, under the bell tower, facing it
    tear: { x: -29.6, z: -157.0 },                          // the little tear you came through: the way home
    ringer: { x: -25.0, z: -162.6 }, helper: { x: -27.3, z: -162.8 }, shy: { x: -22.4, z: -158.6 },
    rosita: { x: -16.9, z: -133.0 }, cart: { x: -14.3, z: -134.6 },
    apples: [{ id: 'awning', verb: 'v.jump', x: -19.0, y: 2.62, z: -130.1, at: { x: -19.4, z: -133.4 } },
      { id: 'fountain', verb: 'v.swim', x: -12.9, y: 0.62, z: -143.9, at: { x: -14.2, z: -141.6 } },
      { id: 'cart', verb: 'v.push', x: -14.3, y: 0.3, z: -134.6, at: { x: -12.6, z: -132.7 } }],
    fountain: { x: -10, z: -146 }, names: { x: -10.2, z: -139.0 },
    elio: { x: 5.4, z: -174.0 }, pond: { x: 9, z: -178.5 },
    scenes: [{ id: 's1', x: -10.4, z: -138.6, look: { x: -10, y: 1.4, z: -146 } }, { id: 's2', x: -23.6, z: -156.0, look: { x: -26, y: 10.6, z: -166 } }, { id: 's3', x: -4.6, z: -138.6, look: { x: -4.4, y: 1.2, z: -133.6 } }],
    band: [{ x: -6.0, z: -133.4 }, { x: -3.6, z: -133.0 }], dancers: [{ x: -5.6, z: -136.2 }, { x: -3.2, z: -136.4 }],
    theater: { x: -13.5, z: -233.9 }, report: { x: -11.0, z: -229.4 }, future: { x: -10, z: -136.6 },
  };
  // where you are while inside (main.js saves it as the place you'll stand when you load: the tower's landing)
  const OUTSIDE = { x: 14, z: -395, yaw: Math.PI };
  const towerOut = () => { if (typeof OLDTOWER !== 'undefined' && OLDTOWER.OUTSIDE) Object.assign(OUTSIDE, OLDTOWER.OUTSIDE); return OUTSIDE; };

  // ------------------------------------------------------------ a toon kit: pieces in vertex colors, merged, one ink hull
  let VCM = null, HULLM = null;
  const mats = () => { if (!VCM) { VCM = TK.toon('#ffffff', { vc: 1, rim: 0.2 }); HULLM = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); } return { VCM, HULLM }; };
  const lathe = (pts, n = 14) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  const KG = { box: TK.G.box, sphere: new THREE.SphereGeometry(1, 12, 9), ball6: new THREE.SphereGeometry(1, 8, 6), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
    cone: new THREE.ConeGeometry(1, 1, 10), cone4: new THREE.ConeGeometry(1, 1, 4), half: new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), torus: new THREE.TorusGeometry(1, 0.22, 6, 16),
    body: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), robe: lathe([[0, 0], [0.42, 0.02], [0.4, 0.4], [0.3, 0.72], [0.2, 0.92], [0.1, 0.98], [0, 0.99]]) };
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  function Kit() {
    const solid = [], hull = [];
    const k = {
      addM(geo, m, color, ink = 0.022) {
        solid.push({ geo, m, color });
        if (ink > 0) { m.decompose(_v, _q, _s); hull.push({ geo, m: m.clone().multiply(new THREE.Matrix4().makeScale(1 + 1.6 * ink / Math.max(0.03, _s.x), 1 + 1.6 * ink / Math.max(0.03, _s.y), 1 + 1.6 * ink / Math.max(0.03, _s.z))), color: INK }); }
        return k;
      },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) { return k.addM(geo, TK.M4(x, y, z, sx, sy, sz, o.ry || 0, o.rx || 0, o.rz || 0), color, o.ink === undefined ? 0.022 : o.ink); },
      box(x, y, z, w, h, d, color, o) { return k.add(KG.box, x, y, z, w, h, d, color, o); },
      rod(a, b, r, color, ink = 0.012, geo = KG.cyl6) {
        const d = _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length() || 1e-3, q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
        return k.addM(geo, new THREE.Matrix4().compose(V((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V(r, len, r)), color, ink);
      },
      get n() { return solid.length; },
      build(parent, o = {}) {
        const M = mats(), out = [];
        if (solid.length) { const m = new THREE.Mesh(TK.merge(solid), o.mat || M.VCM); m.castShadow = o.shadow !== false; m.receiveShadow = true; parent.add(m); out.push(m); }
        if (hull.length && o.hull !== false) { const h = new THREE.Mesh(TK.merge(hull), M.HULLM); parent.add(h); out.push(h); }
        return out;
      },
    };
    return k;
  }
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); return sp; };

  // ------------------------------------------------------------ people (one merged mesh and its ink each)
  // o: { skin, hair, hairdo (bun, tails, braids, short, bald), dress, apron, vest, shawl, robe, hat (cap, flat, straw, scarf, beret),
  //      hatColor, beard, stache, glasses, kid, h, prop (bell, lantern, basket, guitar, accordion, cane, baton, cap), seat, ribbon }
  function personKit(o) {
    const k = Kit(), Wd = o.wide || 1, y0 = o.seat ? -0.36 : 0, hy = y0 + 1.18;
    k.add(o.robe ? KG.robe : KG.body, 0, y0, 0, Wd, 1, Wd, o.robe || o.dress, { ink: 0.02 });
    if (o.apron) k.add(KG.sphere, 0, y0 + 0.42, 0.26 * Wd, 0.24, 0.32, 0.08, o.apron, { ink: 0.01 });
    if (o.vest) k.add(KG.sphere, 0, y0 + 0.62, 0.12, 0.28, 0.3, 0.24, o.vest, { ink: 0.01 });
    if (o.shawl) k.add(KG.torus, 0, y0 + 0.86, 0, 0.27, 0.27, 0.6, o.shawl, { rx: Math.PI / 2 });
    if (o.robe) k.add(KG.torus, 0, y0 + 0.9, 0.02, 0.2, 0.2, 0.5, '#f4efe0', { rx: Math.PI / 2, ink: 0.008 });       // (the choir robe's white collar)
    for (const s of [-1, 1]) { k.rod([s * 0.25 * Wd, y0 + 0.86, 0.04], [s * 0.33 * Wd, y0 + 0.56, 0.16], 0.065, o.sleeve || o.robe || o.dress, 0.012, KG.cyl); k.add(KG.ball6, s * 0.33 * Wd, y0 + 0.53, 0.18, 0.075, 0.075, 0.075, o.skin, { ink: 0.008 }); }
    k.add(KG.sphere, 0, hy, 0, 0.28, 0.27, 0.27, o.skin);
    if (o.hairdo === 'bald') for (const s of [-1, 1]) k.add(KG.ball6, s * 0.24, hy - 0.01, -0.07, 0.08, 0.11, 0.13, o.hair, { ink: 0.008 });
    else k.add(KG.half, 0, hy + 0.02, -0.02, 0.29, 0.29, 0.29, o.hair, { rx: -0.5 });
    if (o.hairdo === 'bun') k.add(KG.ball6, 0, hy + 0.22, -0.2, 0.12, 0.12, 0.12, o.hair);
    if (o.hairdo === 'tails' || o.hairdo === 'braids') for (const s of [-1, 1]) { k.add(KG.ball6, s * 0.3, hy - 0.02, -0.06, 0.1, o.hairdo === 'braids' ? 0.2 : 0.1, 0.1, o.hair); if (o.ribbon) k.add(KG.ball6, s * 0.3, hy + 0.1, -0.05, 0.07, 0.05, 0.07, o.ribbon, { ink: 0.006 }); }
    for (const s of [-1, 1]) {
      k.add(KG.ball6, s * 0.1, hy + 0.01, 0.235, 0.04, 0.06, 0.03, '#2b2235', { ink: 0 });
      k.add(KG.ball6, s * 0.1 + 0.013, hy + 0.035, 0.258, 0.014, 0.014, 0.01, '#ffffff', { ink: 0 });
      k.add(KG.ball6, s * 0.17, hy - 0.09, 0.222, 0.05, 0.028, 0.015, '#ff9aa6', { ink: 0 });
    }
    k.add(KG.ball6, 0, hy - 0.11, 0.265, 0.035, 0.012, 0.01, '#2b2235', { ink: 0 });
    if (o.glasses) for (const s of [-1, 1]) k.add(KG.torus, s * 0.1, hy + 0.01, 0.258, 0.068, 0.068, 0.068, '#2b2235', { ink: 0 });
    if (o.stache) for (const s of [-1, 1]) k.add(KG.ball6, s * 0.07, hy - 0.08, 0.255, 0.075, 0.035, 0.045, o.hair2 || '#e8e4dc', { ink: 0.006 });
    if (o.beard) k.add(KG.ball6, 0, hy - 0.16, 0.16, 0.17, 0.15, 0.12, o.hair2 || '#e8e4dc');
    const hc = o.hatColor;
    if (o.hat === 'flat') { k.add(KG.cyl, 0, hy + 0.24, 0.02, 0.27, 0.08, 0.27, hc || '#6b5a4a', { rx: -0.12 }); k.box(0, hy + 0.21, 0.25, 0.3, 0.03, 0.16, hc || '#6b5a4a', { rx: 0.2 }); }
    if (o.hat === 'straw') { k.add(KG.cyl, 0, hy + 0.25, 0, 0.5, 0.035, 0.5, '#e8c57a'); k.add(KG.half, 0, hy + 0.26, 0, 0.22, 0.2, 0.22, '#e8c57a'); k.add(KG.cyl, 0, hy + 0.3, 0, 0.225, 0.05, 0.225, hc || '#e05a4b', { ink: 0 }); }
    if (o.hat === 'cap') { k.add(KG.half, 0, hy + 0.12, 0, 0.3, 0.2, 0.3, hc || '#c9443a'); k.box(0, hy + 0.13, 0.27, 0.3, 0.025, 0.18, hc || '#c9443a'); }
    if (o.hat === 'beret') k.add(KG.sphere, 0.05, hy + 0.25, -0.02, 0.27, 0.08, 0.27, hc || '#7a4fa0', { rz: 0.2 });
    if (o.hat === 'scarf') k.add(KG.half, 0, hy + 0.04, -0.02, 0.31, 0.3, 0.31, hc || '#c9553f', { rx: -0.35 });
    const R = [0.33 * Wd, y0 + 0.53, 0.18], Lh = [-0.33 * Wd, y0 + 0.53, 0.18], p = o.prop;
    if (p === 'bell') { k.rod([R[0], R[1], R[2]], [R[0], R[1] + 0.16, R[2]], 0.025, '#6b4a30', 0.006); k.add(KG.half, R[0], R[1] + 0.02, R[2] + 0.02, 0.12, -0.17, 0.12, '#e8b83e'); }
    if (p === 'lantern') { k.box(R[0], R[1] - 0.18, R[2] + 0.05, 0.2, 0.26, 0.2, '#f6e7a8', { ink: 0.006 }); k.box(R[0], R[1] - 0.03, R[2] + 0.05, 0.24, 0.05, 0.24, '#2f3440'); }
    if (p === 'basket') { k.add(KG.cyl, Lh[0], Lh[1] - 0.06, Lh[2] + 0.05, 0.2, 0.16, 0.2, '#b8864f'); for (let i = 0; i < 4; i++) k.add(KG.ball6, Lh[0] + (i % 2 - 0.5) * 0.14, Lh[1] + 0.05, Lh[2] + 0.05 + (i > 1 ? 0.07 : -0.05), 0.075, 0.075, 0.075, '#d8402f', { ink: 0.006 }); }
    if (p === 'guitar') { k.add(KG.ball6, 0.06, y0 + 0.5, 0.3, 0.2, 0.24, 0.07, '#b8703a'); k.box(-0.18, y0 + 0.72, 0.31, 0.06, 0.06, 0.5, '#5a3a24', { ry: 0.9, rx: 0.4 }); }
    if (p === 'accordion') { k.box(0, y0 + 0.55, 0.3, 0.5, 0.32, 0.18, '#c9443a'); for (let i = 0; i < 5; i++) k.box(-0.2 + i * 0.1, y0 + 0.55, 0.4, 0.02, 0.3, 0.02, '#f4efe0', { ink: 0 }); }
    if (p === 'cane') k.rod([R[0], y0 + 0.02, R[2] + 0.1], [R[0], R[1] + 0.04, R[2]], 0.025, '#5a3a24', 0.006);
    if (p === 'baton') k.rod([R[0], R[1], R[2]], [R[0] + 0.05, R[1] + 0.35, R[2] + 0.2], 0.012, '#fdf8ee', 0);
    if (p === 'cap') { k.add(KG.half, R[0], R[1] + 0.02, R[2] + 0.06, 0.13, 0.09, 0.13, '#c9443a', { ink: 0.006 }); k.box(R[0], R[1] + 0.02, R[2] + 0.18, 0.14, 0.02, 0.09, '#c9443a', { ink: 0 }); }
    return { k, top: (hy + 0.36) };
  }
  // a person: { g, body, api, o } (api: what STORY.demoLine / sayInline read: x, y, z, top, name, talking)
  function person(id, o, at) {
    const { k, top } = personKit(o), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    k.build(body);
    const h = o.h || (o.kid ? 0.78 : 1); g.scale.setScalar(h);
    const P = { id, o, g, body, h, ph: (id.length * 1.37) % 6.28, api: { id, name: '', x: at.x, z: at.z, y: gy(at.x, at.z), top: top * h + 0.1, talking: false, yaw: at.yaw || 0 }, hop: 0 };
    place(P, at.x, at.z, at.yaw);
    W.root.add(g); W.people[id] = P;
    return P;
  }
  function place(P, x, z, yaw, y) { P.api.x = x; P.api.z = z; P.api.y = y !== undefined ? y : gy(x, z); if (yaw !== undefined) P.api.yaw = yaw; P.g.position.set(x, P.api.y, z); P.g.rotation.y = P.api.yaw; }
  const faceTo = (P, x, z) => { P.api.yaw = Math.atan2(x - P.api.x, z - P.api.z); P.g.rotation.y = P.api.yaw; };
  const show = (P, on) => { if (P) P.g.visible = !!on; };
  // the looks (es names: the other languages share the people, with their own names)
  const LOOKS = {
    ringer: { skin: '#e6b48c', hair: '#e8e4dc', hairdo: 'bald', beard: true, stache: true, dress: '#4f5f7a', vest: '#8a6a4a', hat: 'flat', hatColor: '#3d3a48', prop: 'cane', h: 1.02 },
    helper: { kid: true, skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#3f7fc9', vest: '#e8d4b0', hat: 'flat', hatColor: '#5a5048', h: 0.84 },
    shy: { kid: true, skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'tails', dress: '#e8a0b8', ribbon: '#ffffff', h: 0.68 },
    shyBoy: { kid: true, skin: '#e6b48c', hair: '#3a2b26', hairdo: 'short', dress: '#6f8a4a', vest: '#f4efe0', h: 0.74 },
    rosita: { kid: true, skin: '#efc29a', hair: '#8a4a2a', hairdo: 'braids', ribbon: '#e2453a', dress: '#e07a4f', apron: '#fbf6ee', h: 0.76 },
    elio: { kid: true, skin: '#d9a87e', hair: '#2b211d', hairdo: 'short', dress: '#5c6fa8', vest: '#d8c39a', hat: 'cap', hatColor: '#d23a32', h: 0.78 },
  };
  const CROWD = [
    { skin: '#f0c7a0', hair: '#5a3a26', hairdo: 'bun', dress: '#e8d4b0', apron: '#ffffff', hat: 'scarf', hatColor: '#d0663f' },
    { skin: '#c98e62', hair: '#2e2420', dress: '#3d5fa1', hat: 'straw', hatColor: '#3f7fc9', stache: true, hair2: '#2e2420' },
    { kid: true, skin: '#e6b48c', hair: '#3a2b26', hairdo: 'tails', dress: '#5fae4f', h: 0.72 },
    { skin: '#a8714a', hair: '#1f1a18', dress: '#7a4fa0', shawl: '#e8b83e', hairdo: 'bun' },
    { skin: '#efc29a', hair: '#e8e4dc', hairdo: 'bun', dress: '#5c4a7a', glasses: true, shawl: '#c9443a' },
    { kid: true, skin: '#f0c7a0', hair: '#c9873a', dress: '#e2453a', h: 0.7 },
    { skin: '#dcae86', hair: '#4a3020', dress: '#6f8a4a', vest: '#a8784e', hat: 'flat' },
    { skin: '#e6b48c', hair: '#8a6a4a', hairdo: 'tails', dress: '#3e8f8a', apron: '#fdf8ee' },
    { skin: '#c98e62', hair: '#e8e4dc', hairdo: 'bald', dress: '#8a5f3e', beard: true, hair2: '#e8e4dc' },
    { kid: true, skin: '#d9a87e', hair: '#2b211d', dress: '#ffd84a', h: 0.66 },
  ];

  // ------------------------------------------------------------ the dressing: the festival mast, bunting, lanterns, the banner
  // (poles only where nothing stands: every town's solids are checked)
  function clear(x, z, pad = 0.7) {
    for (const c of WORLD.colliders.concat(WORLD.extra || [])) {
      if (!c || c.x > 1e4) continue;
      if (c.obox) { const cs = Math.cos(c.rot || 0), sn = Math.sin(c.rot || 0), lx = (x - c.x) * cs - (z - c.z) * sn, lz = (x - c.x) * sn + (z - c.z) * cs; if (Math.abs(lx) < c.hw + pad && Math.abs(lz) < c.hd + pad) return false; }
      else if (c.r && Math.hypot(x - c.x, z - c.z) < c.r + pad) return false;
    }
    return true;
  }
  function bannerTex() {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 112;
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4;
    const paint = () => {
      const c = cv.getContext('2d'), l = lang(), T = PTXT.NAMES;
      c.clearRect(0, 0, 512, 112); c.fillStyle = '#c9443a'; c.fillRect(0, 8, 512, 96); c.fillStyle = '#e8b83e'; c.fillRect(0, 8, 512, 6); c.fillRect(0, 98, 512, 6);
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#e8b83e' : '#fdf8ee'; c.beginPath(); c.moveTo(i * 32, 104); c.lineTo(i * 32 + 16, 112); c.lineTo(i * 32 + 32, 104); c.fill(); }
      const a0 = PTXT.pick(T.festival, l).replace(/[「」]/g, '').trim(), a = a0.charAt(0).toUpperCase() + a0.slice(1), b = '«' + PTXT.pick(T.motto, l) + '»';
      c.fillStyle = '#fffaf0'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 36; c.font = `800 ${fs}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; while (c.measureText(a).width > 480 && fs > 16) { fs -= 2; c.font = `800 ${fs}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; } c.fillText(a, 256, 44);
      fs = 22; c.font = `italic 600 ${fs}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; while (c.measureText(b).width > 480 && fs > 12) { fs -= 1; c.font = `italic 600 ${fs}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; } c.fillText(b, 256, 80);
      tx.needsUpdate = true; W.bannerLang = l;
    };
    paint(); return { tx, paint };
  }
  function buildDressing() {
    const k = Kit(), P = SP.fountain, top = 8.6, lan = [];
    // the mast in the fountain's middle, a gold bell on top (the festival's)
    k.add(KG.cyl, P.x, 4.3, P.z, 0.12, 8.6, 0.12, '#8a5f3e', { ink: 0.012 }).add(KG.half, P.x, top + 0.42, P.z, 0.32, -0.46, 0.32, '#e8b83e', { ink: 0.014 }).add(KG.ball6, P.x, top + 0.48, P.z, 0.1, 0.1, 0.1, '#e8b83e', { ink: 0.008 });
    // poles round the plaza (where they fit), the bunting from the mast down to each, and a lantern on each pole
    const poles = [];
    for (const deg of [21, 59, 105, 150, 201, 239, 290, 330]) {
      for (const r of [11.2, 10.4, 12.0]) { const x = P.x + Math.cos(deg * Math.PI / 180) * r, z = P.z + Math.sin(deg * Math.PI / 180) * r; if (clear(x, z)) { poles.push({ x, z }); break; } }
    }
    const COLS = ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f', '#ff8fb1', '#fdf8ee'];
    poles.forEach((p, j) => {
      const y0 = gy(p.x, p.z);
      k.add(KG.cyl6, p.x, y0 + 2.4, p.z, 0.07, 4.8, 0.07, '#7a5a40', { ink: 0.01 }).add(KG.ball6, p.x, y0 + 4.85, p.z, 0.09, 0.09, 0.09, '#e8b83e', { ink: 0.006 });
      // a paper lantern hanging off the pole
      k.add(KG.sphere, p.x, y0 + 4.2, p.z, 0.2, 0.26, 0.2, ['#ffcf6a', '#ff9f6a', '#ffe7a0'][j % 3], { ink: 0.008 });
      lan.push({ x: p.x, y: y0 + 4.2, z: p.z });
      const a = [P.x, top - 0.2, P.z], b = [p.x, y0 + 4.7, p.z];
      for (let i = 1; i <= 11; i++) {
        const t = i / 12, x = lerp(a[0], b[0], t), z = lerp(a[2], b[2], t), y = lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * 1.1;
        k.add(KG.cone4, x, y - 0.22, z, 0.2, 0.38, 0.035, COLS[(i + j) % COLS.length], { rx: Math.PI, ry: Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2, ink: 0.004 });
      }
      W.solids.push({ x: p.x, z: p.z, r: 0.18 });
    });
    W.solids.push({ x: P.x, z: P.z, r: 0.2 });
    k.build(W.root, { shadow: false });
    // the banner on the mast, facing south (the way you come into the plaza)
    const B = bannerTex(); W.banner = B;
    for (const s of [1, -1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.92), new THREE.MeshBasicMaterial({ map: B.tx, transparent: true, side: THREE.FrontSide })); m.position.set(P.x, 5.6, P.z + s * 0.16); if (s < 0) m.rotation.y = Math.PI; W.root.add(m); }
    // the lanterns' glows (bright at night, a faint warmth by day)
    W.lanterns = lan.map(p => { const g = glow('#ffcf6a', 2.2, 0.15); g.position.set(p.x, p.y, p.z); W.root.add(g); return g; });
    // the bell up in the tower: a glow that shines like new (the town's bell is drawn by town.js; this is its shine)
    const bt = TL().bellTower || { x: -26, z: -166 };
    W.bellGlow = glow('#ffe39a', 3.4, 0.35); W.bellGlow.position.set(bt.x, gy(bt.x, bt.z) + 10.4, bt.z + 0.2); W.root.add(W.bellGlow);
    // the little tear you came through, by the tower: the way home (a swirl, like the one in the tower's door)
    const tt = TK.canvasTex(128, 128, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,248,220,1)'); g.addColorStop(0.3, 'rgba(255,214,120,0.9)'); g.addColorStop(0.65, 'rgba(120,120,230,0.6)'); g.addColorStop(1, 'rgba(20,16,60,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2;
      for (let s = 0; s < 5; s++) { c.beginPath(); for (let a = 0; a < 5; a += 0.1) { const r = 4 + a * 9 + s, x = w / 2 + Math.cos(a + s * 1.2) * r, y = h / 2 + Math.sin(a + s * 1.2) * r; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    });
    W.tear = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ map: tt, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    W.tear.position.set(SP.tear.x, gy(SP.tear.x, SP.tear.z) + 1.4, SP.tear.z); W.tear.scale.set(0.8, 1.15, 1); W.root.add(W.tear);
    W.tearGlow = glow('#ffe4a0', 2.0, 0.25); W.tearGlow.position.copy(W.tear.position); W.root.add(W.tearGlow);
  }
  // the sky of the Past: a gradient dome of its own (the world's sky is hidden while you're here)
  function buildSky() {
    const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color('#5fa0e6') }, hor: { value: new THREE.Color('#ffe3b0') }, sunC: { value: new THREE.Color('#fff2c8') }, sunDir: { value: V(0.45, 0.35, -0.82).normalize() }, sunK: { value: 0.5 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunC; uniform vec3 sunDir; uniform float sunK; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 col = mix(hor, top, pow(h, 0.5));
          float s = max(dot(vDir, sunDir), 0.0); col += sunC * (pow(s, 10.0) * 0.4 + smoothstep(0.996, 0.9985, s) * 0.9) * sunK;
          gl_FragColor = vec4(col, 1.0); }` });
    W.sky = new THREE.Mesh(new THREE.SphereGeometry(520, 28, 14), m); W.sky.renderOrder = -1; W.sky.frustumCulled = false; W.sky.visible = false; G.w3d.scene.add(W.sky);
  }
  // Noa's echo: a pale ghost of her (the clock shows her yesterday, and she shows it to you), always near you
  function buildNoa() {
    const { k, top } = personKit({ skin: '#f0c9a2', hair: '#3a2a24', hairdo: 'tails', ribbon: '#f2c94c', dress: '#2f8f8a', vest: '#e2683f', h: 0.92 });
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body); g.scale.setScalar(0.92);
    k.build(body, { mat: new THREE.MeshBasicMaterial({ vertexColors: true, color: '#e4f0ff', transparent: true, opacity: 0.5, depthWrite: false }), hull: false, shadow: false });
    const gl = glow('#a8dcff', 1.8, 0.16); gl.position.y = 0.8; g.add(gl);
    W.root.add(g);
    W.noa = { g, body, gl, k: 0, api: { id: 'noa', name: 'Noa', x: 0, y: 0, z: 0, top: top * 0.92 + 0.2, talking: false }, on: false, x: 0, z: 0, hold: null };
  }
  function build() {
    if (built) return; built = true;
    W.root = new THREE.Group(); W.root.name = 'past'; W.root.visible = false; G.w3d.scene.add(W.root);
    W.solids = [];
    try { buildDressing(); } catch (e) { console.error('[past] dressing', e); }
    try { buildSky(); } catch (e) { console.error('[past] sky', e); }
    try { buildNoa(); } catch (e) { console.error('[past] noa', e); }
    // the people of then (their names come from PTXT.CAST per language; past_scenes.js moves them as the day goes on)
    const l = lang(), nm = id => PTXT.pick(PTXT.CAST[id], l);
    person('ringer', LOOKS.ringer, Object.assign({ yaw: 0 }, SP.ringer)).api.name = nm('ringer');
    person('helper', LOOKS.helper, Object.assign({ yaw: 0.25 }, SP.helper)).api.name = nm('helper');
    person('shy', l === 'pt' ? LOOKS.shyBoy : LOOKS.shy, Object.assign({ yaw: -2.6 }, SP.shy)).api.name = nm('shy');
    person('rosita', LOOKS.rosita, Object.assign({ yaw: 2.4 }, SP.rosita)).api.name = nm('rosita');
    person('elio', LOOKS.elio, Object.assign({ yaw: 2.3 }, SP.elio)).api.name = nm('elio');
    // the crowd round the fountain (the names), two musicians by the inn, and two kids dancing
    CROWD.forEach((o, i) => { const a = (i / CROWD.length) * TAU + 0.31, r = i % 2 ? 7.4 : 6.6, x = SP.fountain.x + Math.cos(a) * r, z = SP.fountain.z + Math.sin(a) * r; const p = person('crowd' + i, o, { x, z }); faceTo(p, SP.fountain.x, SP.fountain.z); });
    person('band0', { skin: '#c98e62', hair: '#2e2420', dress: '#3d5fa1', vest: '#e8b83e', hat: 'straw', hatColor: '#e2453a', prop: 'guitar', stache: true, hair2: '#2e2420' }, Object.assign({ yaw: Math.PI }, SP.band[0]));
    person('band1', { skin: '#efc29a', hair: '#8a4a2a', hairdo: 'bun', dress: '#5fae4f', shawl: '#ffd84a', prop: 'accordion' }, Object.assign({ yaw: Math.PI }, SP.band[1]));
    person('dancer0', { kid: true, skin: '#f0c7a0', hair: '#5a3a26', hairdo: 'tails', dress: '#ff8fb1', h: 0.7 }, SP.dancers[0]);
    person('dancer1', { kid: true, skin: '#c98e62', hair: '#2b211d', dress: '#ffd84a', vest: '#3f7fc9', h: 0.72 }, SP.dancers[1]);
    for (const P of Object.values(W.people)) { const sol = { x: P.api.x, z: P.api.z, r: P.o.kid ? 0.32 : 0.4, past: P.id }; P.solid = sol; W.solids.push(sol); }
    const sc = SC(); if (sc && sc.build) { try { sc.build(API); } catch (e) { console.error('[past] scenes build', e); } }
  }

  // ------------------------------------------------------------ the light: dawn → day → sunset → night, with the story
  const PAL = [
    { top: '#7f8fd6', hor: '#ffc79a', sunC: '#ffd2a0', sunK: 0.9, fog: '#f0c8a8', hemiS: '#ffdcc0', hemiG: '#7a6a4a', hemiI: 0.56, sun: '#ffc78a', sunI: 0.6, near: 40, far: 175, lamp: 0.35, sepia: 0.3, grass: '#f6dcb4' },
    { top: '#5f9fe4', hor: '#ffe6b8', sunC: '#fff2c8', sunK: 0.5, fog: '#f1dcb6', hemiS: '#fff0d4', hemiG: '#7c7448', hemiI: 0.6, sun: '#ffe2aa', sunI: 0.74, near: 45, far: 190, lamp: 0.12, sepia: 0.26, grass: '#fbefcf' },
    { top: '#5d63b0', hor: '#ff9f6a', sunC: '#ffb070', sunK: 1.0, fog: '#e8ab88', hemiS: '#ffc89c', hemiG: '#6a5040', hemiI: 0.5, sun: '#ff9c5a', sunI: 0.58, near: 38, far: 160, lamp: 0.55, sepia: 0.32, grass: '#e8b48e' },
    { top: '#121838', hor: '#3c3c70', sunC: '#a8b8ff', sunK: 0.25, fog: '#2c2c4c', hemiS: '#7080c0', hemiG: '#2a2030', hemiI: 0.46, sun: '#a4b0ff', sunI: 0.2, near: 26, far: 120, lamp: 1.0, sepia: 0.14, grass: '#5a6496' },
  ].map(p => { const o = {}; for (const [k, v] of Object.entries(p)) o[k] = typeof v === 'string' ? new THREE.Color(v) : v; return o; });
  let todK = 1, lights = null, light0 = null, sky0 = null;
  const _c1 = new THREE.Color(), _c2 = new THREE.Color();
  // (after Chapter 2, flags.pastDone, the Past is a world you visit through time cracks (time.js): an ordinary day of then)
  const todWant = () => { if (W.forceTod != null) return W.forceTod; const f = F(); if (f.pastDone) return 1; return !f.pastBell ? 0 : !f.pastScene ? 1 : !f.pastBoss ? 2 : 3; };
  function palAt(key, k) { const i = Math.min(2, Math.floor(k)), u = k - i, a = PAL[i][key], b = PAL[i + 1][key]; return typeof a === 'number' ? lerp(a, b, u) : _c1.copy(a).lerp(b, u); }
  // tod: the hour to light (time.js's shared look, for another region's Past); else the story's
  function applyLight(dt, tod) {
    const want = tod != null ? tod : todWant(); todK = dt == null ? want : damp(todK, want, 0.7, dt); if (Math.abs(todK - want) < 0.002) todK = want;
    const sc = G.w3d.scene;
    if (!lights) { lights = sc.children.filter(o => o.isHemisphereLight || o.isDirectionalLight); light0 = lights.map(o => ({ o, c: o.color.clone(), g: o.groundColor ? o.groundColor.clone() : null })); }
    if (!sky0) sky0 = sc.children.find(o => o.isMesh && o !== W.sky && o.material && o.material.uniforms && o.material.uniforms.sunDir && o.geometry && o.geometry.parameters && o.geometry.parameters.radius >= 500) || null;
    if (sky0) sky0.visible = false;
    const U = W.sky && W.sky.material.uniforms;
    if (U) { U.top.value.copy(palAt('top', todK)); U.hor.value.copy(palAt('hor', todK)); U.sunC.value.copy(palAt('sunC', todK)); U.sunK.value = palAt('sunK', todK); W.sky.visible = true; W.sky.position.copy(G.w3d.camera.position); }
    sc.fog.color.copy(palAt('fog', todK)); sc.fog.near = palAt('near', todK); sc.fog.far = palAt('far', todK);
    for (const L of lights) {
      if (L.isHemisphereLight) { L.color.copy(palAt('hemiS', todK)); L.groundColor.copy(_c2.copy(palAt('hemiG', todK))); L.intensity = palAt('hemiI', todK); }
      else { L.color.copy(palAt('sun', todK)); L.intensity = palAt('sunI', todK); }
    }
    // the warm grade of an old photograph over the whole picture (the UI stays as it is: it's not on the canvas)
    const sep = palAt('sepia', todK), cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = `sepia(${sep.toFixed(3)}) saturate(${(1.06 + sep * 0.5).toFixed(3)}) hue-rotate(${(-sep * 22).toFixed(1)}deg) contrast(1.03)`;
    if (G.w3d.grassTint) G.w3d.grassTint.copy(palAt('grass', todK));      // (the grass is unlit: it takes the hour's light this way)
    const lamp = palAt('lamp', todK);
    if (W.lanterns) W.lanterns.forEach((g, i) => { g.material.opacity = lamp * (0.62 + 0.08 * Math.sin(G.w3d.time.value * 2.3 + i)); g.scale.setScalar(2.0 + lamp * 1.2); });
    W.todK = todK;
  }
  function restoreLight() {
    if (light0) light0.forEach(({ o, c, g }) => { o.color.copy(c); if (g && o.groundColor) o.groundColor.copy(g); });
    if (G.w3d.grassTint) G.w3d.grassTint.setRGB(1, 1, 1);
    if (sky0) sky0.visible = true;
    if (W.sky) W.sky.visible = false;
  }

  // ------------------------------------------------------------ the present, set aside while you're here
  const park = {};
  const STORY_NPCS = ['rosa', 'kid', 'baker', 'bruno'];
  function parkPresent(on) {
    for (const id of STORY_NPCS) {
      const n = G.sim.npc(id), v = G.cast && G.cast.npcs && G.cast.npcs[id];
      if (n) { if (on) { if (!park[id]) park[id] = { x: n.x, z: n.z }; n.x = OFF + 3 * STORY_NPCS.indexOf(id); n.z = OFF; } else if (park[id]) { n.x = park[id].x; n.z = park[id].z; delete park[id]; } }
      if (v && v.root) v.root.visible = !on;
    }
    if (on) { for (const s of W.solids) if (!WORLD.extra.includes(s)) WORLD.extra.push(s); }
    else for (const s of W.solids) { const i = WORLD.extra.indexOf(s); if (i >= 0) WORLD.extra.splice(i, 1); }
  }
  const MODS = ['townlife', 'minigames', 'domino', 'phonk', 'adolf', 'romance', 'cards', 'newyear', 'muertos', 'matsuri', 'carnaval', 'weihnacht', 'lucha', 'familia', 'shogi', 'doener'];
  function hidePresent() {
    const town = G.town;
    if (town && town.objects && town.objects.folks) town.objects.folks.forEach(m => { if (m) m.visible = false; });
    for (const k of MODS) { const m = G[k]; if (m && m.group) m.group.visible = false; }
    for (const id of STORY_NPCS) { const v = G.cast && G.cast.npcs && G.cast.npcs[id]; if (v && v.root) v.root.visible = false; }
    // the side modules' outdoor bits drawn straight into the scene (the restaurant's lanterns, the library's sign…)
    if (!W.extraHidden) { W.extraHidden = G.w3d.scene.children.filter(o => o.visible && /^(grandma|anime|school|read|library|signs|tactics|yard)/i.test(o.name || '')); }
    W.extraHidden.forEach(o => { o.visible = false; });
  }
  function showPresent() {
    const town = G.town;
    if (town && town.objects && town.objects.folks) town.objects.folks.forEach(m => { if (m) m.visible = true; });
    if (W.extraHidden) { W.extraHidden.forEach(o => { o.visible = true; }); W.extraHidden = null; }
  }

  // ------------------------------------------------------------ in and out
  function veil(on, ms = 600) {
    let el = document.getElementById('past-veil');
    if (!el) { el = document.createElement('div'); el.id = 'past-veil'; el.style.cssText = 'position:fixed;inset:0;z-index:57;background:#fff6e0;opacity:0;pointer-events:none;'; document.body.appendChild(el); }
    if (W.fastVeil) { el.style.transition = 'none'; el.style.opacity = on ? '1' : '0'; return Promise.resolve(); }      // (tests: a hidden tab throttles timers)
    el.style.transition = `opacity ${ms}ms`; void el.offsetWidth; el.style.opacity = on ? '1' : '0';
    return new Promise(r => setTimeout(r, ms + 30));
  }
  function teleport(x, z, yaw) {
    const Yu = G.sim.you, Mm = G.sim.mimo;
    Yu.x = x; Yu.z = z; if (yaw !== undefined) Yu.yaw = yaw; Mm.x = x + 1.1; Mm.z = z + 0.8; Mm.hidden = false; Mm.wander = null; Mm.station = null; Mm.look = null;
    G.sim.snap(); G.cam.snap(Yu.yaw, 0.3, 8.5); W.lastOk = { x, z };
  }
  function setInside(on) {
    if (on === inside) return;
    inside = on; S().inside = on; towerOut();
    if (W.root) W.root.visible = on;
    if (typeof CEMETERY !== 'undefined' && CEMETERY.setEra) { try { CEMETERY.setEra(on ? 'past' : 'now'); } catch (e) { console.error('[past] era', e); } }
    parkPresent(on);
    if (on) { todK = todWant(); applyLight(null); if (W.banner && W.bannerLang !== lang()) W.banner.paint(); for (const P of Object.values(W.people)) P.api.name = PTXT.CAST[P.id] ? PTXT.pick(PTXT.CAST[P.id], lang()) : P.api.name; }
    else { restoreLight(); showPresent(); }
    const sc = SC(); if (sc && sc.onInside) { try { sc.onInside(API, on); } catch (e) { console.error('[past] onInside', e); } }
    if (typeof MINIMAP !== 'undefined' && MINIMAP.rebuild) { try { MINIMAP.rebuild(); } catch (e) { /* */ } }
  }
  const spawn = () => { const sc = SC(); return (sc && sc.spawn && sc.spawn(API)) || SP.arrive; };
  // through the tear in the tower's door (and right after the fall): into the Past
  async function fromTower(o = {}) {
    if (inside || busyNow || !G) return;
    busyNow = true;
    try {
      G.sim.lock = 1;
      await veil(true, o.fall ? 300 : 700);
      build(); setInside(true);
      const sp = spawn(); teleport(sp.x, sp.z, sp.yaw);
      await STORY.wait(0.3);
      await veil(false, 900);
      G.sim.lock = 0;
      const sc = SC();
      if (!F().pastIn && sc && sc.arrival) await sc.arrival(API);
      else STORY.think(F().pastDone ? 'Back in yesterday: Alba, long ago.' : 'Back in yesterday. Noa’s echo floats beside you.', 4);
      G.save();
    } catch (e) { console.error('[past] in', e); G.sim.lock = 0; } finally { busyNow = false; }
  }
  // home through the little tear by the bell tower: the tower's landing, in the present
  async function leave() {
    if (!inside || busyNow) return;
    busyNow = true;
    try {
      G.sim.lock = 1;
      await veil(true, 600);
      setInside(false);
      const o = towerOut(); teleport(o.x, o.z, o.yaw);
      await STORY.wait(0.2);
      await veil(false, 700);
      G.sim.lock = 0;
      STORY.think('The present. The tear in the tower’s door still turns: the Past is through there.', 5);
      G.save();
    } catch (e) { console.error('[past] out', e); G.sim.lock = 0; } finally { busyNow = false; }
  }
  // the Future takes over (future.js enter(): it fades and places you itself): out of the Past, quietly
  async function exitTo(to) { if (!inside) return; setInside(false); W.forceTod = null; }
  // a time crack (time.js, after Chapter 2): straight in, where you step out of the crack (TIME does the trip's veil and saves)
  function enterAt(at) { if (!G) return; build(); setInside(true); teleport(at.x, at.z, at.yaw); }
  // a save made in the Past, loaded: straight back in, where the story is (no scene)
  function restoreQuiet() { build(); setInside(true); const sp = spawn(); teleport(sp.x, sp.z, sp.yaw); }
  // the tower's tear, seen from the present (loading a save after the fall): a nudge, not a card
  function nudge() {
    if (!G || inside || S().inside) return;
    const f = F(); if (f.towerLost && !f.pastDone) STORY.think('The tear in the tower’s door pulls at you… Noa’s voice is on the other side of it.', 5.5);
  }

  // ------------------------------------------------------------ per frame
  // (the memory ends at Alba's edges: Alba, the north street, the Old Quarter and the theater's forecourt)
  const inMem = (x, z) => Math.hypot(x + 10, z + 150) < 46 || (x > -14.6 && x < -5.4 && z < -186 && z > -197) || (x > -27.5 && x < 7.5 && z < -189 && z > -228.5) || (x > -22.5 && x < -4.5 && z <= -222 && z > -235.2);
  let edgeT = 0;
  function update(dt, t) {
    if (!inside) return;
    const Yu = G.sim.you;
    if (!busyNow && !G.sim.lock) {
      if (inMem(Yu.x, Yu.z)) W.lastOk = { x: Yu.x, z: Yu.z };
      else if (W.lastOk) { Yu.x = W.lastOk.x; Yu.z = W.lastOk.z; if ((edgeT -= dt) <= 0) { edgeT = 7; noaSay('pa.noa.edge'); } }
    }
    // the people: a breath, a sway; whoever's talking bobs; the dancers hop; the musicians play
    for (const P of Object.values(W.people)) {
      if (!P.g.visible) continue;
      const a = P.api, k = P.ph;
      P.body.position.y = (a.talking ? Math.abs(Math.sin(t * 12 + k)) * 0.05 : 0) + (P.hop ? Math.abs(Math.sin(t * 6 + k)) * 0.22 * P.hop : 0);
      P.body.rotation.z = Math.sin(t * 1.2 + k) * 0.03 + (/^band/.test(P.id) ? Math.sin(t * 4.2 + k) * 0.05 : 0);
      if (/^dancer/.test(P.id)) { P.hop = 1; P.g.rotation.y = a.yaw + Math.sin(t * 1.6 + k) * 1.2; }
      if (P.solid) { P.solid.x = P.g.visible ? a.x : OFF; P.solid.z = a.z; }
    }
    // Noa's echo floats beside you (or where a scene holds her)
    const N = W.noa;
    if (N) {
      N.k = damp(N.k, N.on ? 1 : 0, 2.5, dt);
      N.g.visible = N.k > 0.02;
      if (N.hold) { N.x = damp(N.x, N.hold.x, 3, dt); N.z = damp(N.z, N.hold.z, 3, dt); }
      else { const yaw = Yu.yaw, tx = Yu.x - Math.sin(yaw) * 1.2 + Math.cos(yaw) * 1.6, tz = Yu.z - Math.cos(yaw) * 1.2 - Math.sin(yaw) * 1.6; N.x = damp(N.x || tx, tx, 1.6, dt); N.z = damp(N.z || tz, tz, 1.6, dt); }
      const y = gy(N.x, N.z) + 0.35 + Math.sin(t * 1.7) * 0.12;
      N.g.position.set(N.x, y, N.z); N.g.rotation.y = N.hold && N.hold.yaw !== undefined ? N.hold.yaw : Math.atan2(Yu.x - N.x, Yu.z - N.z);
      N.body.children.forEach(m => { if (m.material) m.material.opacity = (0.42 + 0.08 * Math.sin(t * 2.3)) * N.k; }); N.gl.material.opacity = 0.16 * N.k;
      Object.assign(N.api, { x: N.x, y, z: N.z });
    }
    if (W.tear) { const own = timeOwns(); W.tear.visible = W.tearGlow.visible = !own; if (!own) { W.tear.rotation.z = -t * 0.9; W.tearGlow.material.opacity = 0.22 + 0.08 * Math.sin(t * 1.7); } }
    if (W.bellGlow) W.bellGlow.material.opacity = (0.25 + 0.1 * Math.sin(t * 1.3)) * (1 - 0.5 * Math.min(1, (W.todK || 0) / 3));
    const sc = SC(); if (sc && sc.update) { try { sc.update(API, dt, t); } catch (e) { console.error('[past] scenes update', e); sc.update = null; } }
  }
  // every frame, before the render (main.js): a save loaded in or out of the Past, the present hidden, the light
  let stateRef = null;
  function late(dt) {
    if (!G) return;
    if (G.state !== stateRef) { stateRef = G.state; if (S().inside && !inside) { try { restoreQuiet(); } catch (e) { console.error('[past] restore', e); } } else if (!S().inside && inside) setInside(false); }
    if (!inside) return;
    hidePresent();
    applyLight(dt);
    keepTheater();
  }
  // the concert puts the camera inside the old theater: main.js camInside would make the whole hall vanish round it (toonkit
  // camCut, meant for a camera backed into a house); in the Past the theater stays, so you see its stage, chairs and walls
  function keepTheater() {
    const CC = typeof TK !== 'undefined' && TK.camCut, b = CC && CC.on;
    const H = b && typeof CEMETERY !== 'undefined' && CEMETERY._ && CEMETERY._.HALL;
    if (H && Math.abs(b.x - H.x) < 0.5 && Math.abs(b.z - H.z) < 0.5) CC.set(null);
  }
  const noaSay = key => { const N = W.noa, T = PTXT.LINES[key]; if (!N || !T || STORY.busy || STORY.line) return; STORY.run(async () => { N.on = true; N.api.name = PTXT.pick(PTXT.CAST.noa, lang()); N.api.lines = { en: PTXT.en(T, lang()), [lang()]: T[lang()] || '' }; await STORY.sayInline(N.api); if (F().pastDone) N.on = false; }); };     // (after Chapter 2 she only shows while she speaks)

  // ------------------------------------------------------------ what you can press E on, where the compass points, the song
  // after Chapter 3 (flags.futureDone) Alba's time cracks (time.js, time_alba.js) open: the yard's crack takes the little tear's place
  const timeOwns = () => typeof TIME !== 'undefined' && !!TIME.open && TIME.open('alba');
  function interactables() {
    const list = [];
    if (!inside || busyNow) return list;
    if (!timeOwns()) list.push({ x: SP.tear.x, z: SP.tear.z, r: 1.9, label: 'Go home through the tear', run: leave });
    const sc = SC();
    if (sc && sc.interactables) { try { list.push(...sc.interactables(API)); } catch (e) { console.error('[past] interactables', e); } }
    // the Old Quarter's people of then (cemetery.js's past era: they talk)
    if (typeof CEMETERY !== 'undefined' && CEMETERY.era === 'past' && CEMETERY.interactables && G.sim.you.z < -186) { try { list.push(...CEMETERY.interactables()); } catch (e) { /* */ } }
    // the time cracks, the cross-time puzzles and their things (time.js)
    if (typeof TIME !== 'undefined' && TIME.interactables) { try { list.push(...TIME.interactables()); } catch (e) { console.error('[past] time', e); } }
    return list;
  }
  function target() { const sc = SC(); return sc && sc.target ? sc.target(API) : null; }
  const song = () => { const sc = SC(), s = sc && sc.song && sc.song(API); return s || (Sound.songs && Sound.songs.includes('past') ? 'past' : 'village'); };
  const AREA = { id: 'past', name: 'Alba, long ago', color: '#c98a3a' }, AREA_Q = { id: 'pastquarter', name: 'The Old Quarter, long ago', color: '#b4703f' };
  const areaAt = (x, z) => (!inside ? null : z < -186 ? AREA_Q : AREA);

  // ------------------------------------------------------------ the API past_scenes.js works with
  const SC = () => (typeof PAST_SC !== 'undefined' ? PAST_SC : null);
  const API = {
    get G() { return G; }, W, SP, S, F, lang, isC, snd, V, gy, Kit, KG, glow, person, personKit, place, faceTo, show, teleport, veil, LOOKS, CROWD, INK, mats,
    get inside() { return inside; }, get busy() { return busyNow; }, set busy(v) { busyNow = !!v; }, setTod(k) { W.forceTod = k; }, fromTower, leave, noaSay, towerOut,
  };

  // ------------------------------------------------------------ init: the hand-off from the Old Tower
  function init(game) {
    G = game;
    // after the fall (oldtower_boss.js → OLDTOWER._.afterFall): straight on into the Past
    if (typeof OLDTOWER !== 'undefined' && OLDTOWER._ && typeof OLDTOWER._.afterFall === 'function' && !OLDTOWER._.afterFall._past) {
      const af0 = OLDTOWER._.afterFall;
      const af = function () { const r = af0.apply(this, arguments); setTimeout(() => { if (G && !inside && G.state.flags.towerLost && !G.state.flags.pastIn) STORY.run(() => fromTower({ fall: true })); }, 700); return r; };
      af._past = true; OLDTOWER._.afterFall = af;
    }
    const sc = SC(); if (sc && sc.init) { try { sc.init(API); } catch (e) { console.error('[past] scenes init', e); } }
  }

  return {
    init, fromTower, leave, exitTo, enterAt, nudge, update, late, interactables, target, song, areaAt, OUTSIDE, SP, API,
    get inside() { return inside; }, get room() { return inside ? 'past' : null },
    curiosities: () => [],
    _: { W, build, setInside, restoreQuiet, applyLight, restoreLight, teleport, inMem, get todK() { return todK; } },
  };
})();
