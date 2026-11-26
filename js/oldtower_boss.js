'use strict';
// The top of the Old Tower (DESIGN.md 14.1 and 17.1; game/REGIONS.md): the great clock with Noa trapped in its face, the
// hooded figure, the fight you lose, and the fall into the Past, «Continuará…». With oldtower.js (the climb) and
// oldtower_text.js (OTXT, the words).
//   OLDBOSS.buildTop(room, kit) · arrive(game, room) · again(game, room) · updateTop(room, dt, t) · topInteractables(game, room)
//   · topTarget(game, room) · busy() · frame(dt) (every frame: the fall's own screen) · figure() / clockFace(o) (the models)
// The fight: G.fight({ boss: 'hooded', foes: [{ kind: 'hooded' }] }). battle/flow.js runs it as a plug-in boss
// (BATTLE._.plugins.hooded: setup, main, foePhase, floor, end) on the cave arena, with the great clock and Noa behind him:
//   your words hit (his hearts go down); then he takes the word (it flies out of Mimo into Noa's notebook and his hearts come
//   back: «…Gracias.»), whispers where it's coming from (the dodge words) and throws it back at you: dodge it. The fight is
//   never lost by hearts (he doesn't throw at your last one). Noa, from the clock: «¡No te calles! ¡Habla!». After the third
//   word, «Basta.»: he winds the clock, its hands run backward, the arena tears, «¿Quieres hablar? Habla… con el ayer.», and
//   he flings you in. It ends there, on white (outcome 'lose', G.hood.fell). Fleeing is allowed: he waits by the clock.
// Then the fall (a full-screen scene of its own): the clock, falling clocks and pages and your stolen words, three captions,
// «Continuará…» and «the Past is coming soon». flags.towerLost; you're on the tower's landing, its door a tear in time.
// Songs: 'boss_hooded' (main.js battleSong picks it for 'hooded') and 'ot_climb' (the climb: oldtower.js's song()).
const OLDBOSS = (() => {
  const { part, G: GEO } = TK;
  const INK = '#2b2235', CLOAK = '#6f6987', CLOAK_D = '#544e69', HAND = '#d8d2e4';
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lang = () => (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const tmat = (c, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(c), gradientMap: TK.grad }, o));
  let busyNow = false;

  // ------------------------------------------------------------ the hooded figure (the cutaways' shape, standing)
  // pose P: open (the notebook, 0 shut at the chest … 1 held up open), raise (his left hand up, to the clock), reach (his right
  // hand out at you), eyes (0 dark … 1 … 2 blazing), lean, look (head turn), float (how high he hovers)
  function figure() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const M = { cloak: tmat(CLOAK), dark: tmat(CLOAK_D), hand: tmat(HAND, { emissive: new THREE.Color('#121019') }), kraft: tmat('#a9784a'), page: tmat('#f1e8d2') };
    const P = (geo, mat, pos, sc, o = {}) => part(geo, null, pos, sc, Object.assign({ mat, ink: 0.014 }, o));
    const prof = [[0, 0], [0.5, 0], [0.52, 0.04], [0.45, 0.16], [0.36, 0.42], [0.3, 0.7], [0.26, 0.92], [0.21, 1.05], [0.12, 1.12], [0, 1.14]];
    const cg = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 30), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + Math.sin(Math.atan2(x, z) * 7 + 0.5) * 0.08 * Math.pow(1 - y / 1.14, 2); cp.setX(i, x * k); cp.setZ(i, z * k); }
    cg.computeVertexNormals();
    body.add(P(cg, M.cloak, [0, 0, 0], null, { ink: 0.016 }));
    body.add(P(GEO.box, M.dark, [0.06, 0.62, -0.31], [0.13, 0.12, 0.02], { ink: 0.007, rot: [0.2, 0.1, 0.1] }));      // a patch on his back
    const arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * 0.22, 0.98, 0.02); body.add(sh);
      sh.add(P(new THREE.CylinderGeometry(0.06, 0.1, 0.42, 12), M.cloak, [0, -0.2, 0]));
      sh.add(P(GEO.sphere, M.hand, [0, -0.44, 0.015], [0.05, 0.058, 0.05], { ink: 0.01 }));
      return sh;
    });
    const head = new THREE.Group(); head.position.set(0, 1.1, 0.03); head.rotation.order = 'YXZ'; body.add(head);
    const hp = [[0, -0.05], [0.215, -0.05], [0.28, 0.05], [0.315, 0.17], [0.31, 0.29], [0.265, 0.41], [0.185, 0.5], [0.085, 0.565], [0, 0.585]];
    const hg = new THREE.LatheGeometry(hp.map(([x, y]) => new THREE.Vector2(x, y)), 28), hq = hg.attributes.position;
    for (let i = 0; i < hq.count; i++) { const y = hq.getY(i), z = hq.getZ(i), r = Math.hypot(hq.getX(i), z) || 1, k = smoothstep(0.12, 0.585, y), over = z > 0 ? 0.06 * smoothstep(0.24, 0.36, y) * (1 - smoothstep(0.4, 0.52, y)) * Math.pow(z / r, 3) : 0; hq.setZ(i, z - k * k * 0.2 + over); }
    hg.computeVertexNormals();
    head.add(P(hg, M.cloak, null, null, { ink: 0.016 }));
    const hole = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#0c0912' })); hole.scale.set(0.19, 0.18, 0.135); hole.position.set(0, 0.19, 0.195); hole.userData.noFlash = true; head.add(hole);
    const eyes = [-1, 1].map(s => {
      const e = new THREE.Group(); e.position.set(s * 0.066, 0.19, 0.326); head.add(e);
      const m = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#eef4ff' })); m.scale.set(0.03, 0.041, 0.014); m.userData.noFlash = true; e.add(m);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#9fc4ff', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(0.16); gl.position.z = 0.012; e.add(gl); e.userData.glow = gl;
      return e;
    });
    const tip = new THREE.Group(); tip.position.set(0, 0.55, -0.17); head.add(tip); tip.add(P(new THREE.ConeGeometry(0.085, 0.24, 12), M.cloak, [0, 0.1, 0], null, { ink: 0.012 }));
    // Noa's notebook: a kraft cover, cream pages; a right half that folds over the left
    const book = new THREE.Group(); body.add(book);
    const halves = [-1, 1].map(s => { const h = new THREE.Group(); book.add(h); h.add(P(new THREE.BoxGeometry(0.2, 0.012, 0.27), M.kraft, [s * 0.1, 0, 0], null, { ink: 0.006 })); h.add(P(new THREE.BoxGeometry(0.19, 0.016, 0.26), M.page, [s * 0.096, 0.012, 0], null, { ink: 0 })); return h; });
    const anchors = {};
    [['top', [0, 1.86, 0.05]], ['mid', [0, 0.95, 0.15]], ['head', [0, 1.36, 0.18]], ['face', [0, 1.33, 0.3]], ['book', [0, 1.05, 0.4]], ['feet', [0, 0.05, 0]]].forEach(([k, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[k] = o; });
    root.traverse(o => { if (o.isMesh && o.material.side !== THREE.BackSide) o.castShadow = true; });
    const S = { open: 0, raise: 0, reach: 0, eyes: 1, lean: 0, look: 0, float: 0.08 };
    function pose(dt, t) {
      body.position.y = S.float + Math.sin(t * 1.4) * 0.035;
      body.rotation.x = S.lean;
      head.rotation.y = S.look; head.rotation.x = 0.06 + Math.sin(t * 0.7) * 0.02;
      tip.rotation.set(-1.85 + Math.sin(t * 1.1) * 0.06, 0, Math.sin(t * 0.8) * 0.08);
      const blink = (t % 4.7) < 0.12;
      eyes.forEach(e => { e.scale.y = blink ? 0.15 : 1; e.visible = S.eyes > 0.02; e.userData.glow.material.opacity = Math.min(1, 0.6 * S.eyes); e.userData.glow.scale.setScalar(0.16 * (1 + Math.max(0, S.eyes - 1) * 1.6)); });
      arms[0].rotation.set(lerp(-1.2, -2.7, S.raise), 0, lerp(0.55, 0.15, S.raise));
      arms[1].rotation.set(lerp(-1.15, -1.55, S.reach), 0, lerp(-0.5, -0.12, S.reach));
      book.position.set(lerp(0.05, -0.12, S.raise), lerp(0.86, 1.5, S.raise), lerp(0.3, 0.36, S.open));
      book.rotation.set(lerp(-1.4, -0.35, S.open), 0, lerp(0.1, 0, S.open));
      halves[1].rotation.z = lerp(Math.PI - 0.04, 0.12, S.open);
    }
    return { root, body, arms, head, eyes, book, anchors, M, S, pose };
  }

  // ------------------------------------------------------------ the great clock, and Noa in its face
  // A big dial (painted numerals), its hands, the glass, and Noa behind it: grayed by the Hush, her hands on the glass.
  // o: { r (the dial's radius) }. update(dt, t): the hands (spin: turns a second, negative = backward), Noa pounding (beat).
  let DIAL = null;
  const dialTex = () => DIAL || (DIAL = TK.canvasTex(512, 512, (c, w) => {
    const h = w / 2; c.fillStyle = '#efe4c8'; c.beginPath(); c.arc(h, h, h - 4, 0, TAU); c.fill();
    const g = c.createRadialGradient(h, h, h * 0.2, h, h, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,100,80,0.35)'); c.fillStyle = g; c.beginPath(); c.arc(h, h, h - 4, 0, TAU); c.fill();
    c.strokeStyle = '#3b3142'; c.lineWidth = 10; c.beginPath(); c.arc(h, h, h - 10, 0, TAU); c.stroke(); c.lineWidth = 3; c.beginPath(); c.arc(h, h, h - 62, 0, TAU); c.stroke();
    const R = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    c.fillStyle = '#3b3142'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 40px Georgia, serif';
    R.forEach((n, i) => { const a = i / 12 * TAU; c.save(); c.translate(h + Math.sin(a) * (h - 38), h - Math.cos(a) * (h - 38)); c.rotate(a); c.fillText(n, 0, 0); c.restore(); });
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, r0 = h - 66, r1 = h - (i % 5 ? 74 : 84); c.lineWidth = i % 5 ? 2 : 5; c.beginPath(); c.moveTo(h + Math.sin(a) * r0, h - Math.cos(a) * r0); c.lineTo(h + Math.sin(a) * r1, h - Math.cos(a) * r1); c.stroke(); }
  }));
  function noaModel(gray = 0.55) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const col = (c) => { const k = new THREE.Color(c), l = k.r * 0.3 + k.g * 0.55 + k.b * 0.15; return k.lerp(new THREE.Color(l * 0.9, l * 0.9, l * 1.0), gray); };
    const P = (geo, c, pos, sc, o = {}) => part(geo, null, pos, sc, Object.assign({ mat: tmat(col(c)), ink: 0.012 }, o));
    const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 18);
    body.add(P(lathe([[0, 0], [0.3, 0.02], [0.3, 0.32], [0.22, 0.62], [0.2, 0.66], [0, 0.67]]), '#2f8f8a'));        // her dress
    body.add(P(lathe([[0, 0.55], [0.23, 0.56], [0.22, 0.78], [0.17, 0.92], [0.08, 0.97], [0, 0.98]]), '#e2683f'));    // her cardigan
    const head = new THREE.Group(); head.position.y = 0.98; body.add(head);
    head.add(P(GEO.sphere, '#f0c9a2', [0, 0.2, 0], [0.26, 0.25, 0.25]));
    head.add(P(new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI * 0.55), '#3a2a24', [0, 0.22, -0.02], [0.28, 0.28, 0.28], { rot: [-0.45, 0, 0] }));
    head.add(P(GEO.sphere, '#3a2a24', [0, 0.26, -0.3], [0.1, 0.17, 0.1], { rot: [0.8, 0, 0] }));       // her ponytail
    head.add(P(GEO.box, '#f2c94c', [0.18, 0.36, 0.06], [0.08, 0.035, 0.03], { ink: 0.004, rot: [0, 0, 0.5] }));     // the yellow hair clip
    [-1, 1].forEach(s => { const e = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#2b2235' })); e.scale.set(0.035, 0.055, 0.02); e.position.set(s * 0.09, 0.22, 0.235); head.add(e); });
    const mouth = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#2b2235' })); mouth.scale.set(0.035, 0.02, 0.01); mouth.position.set(0, 0.1, 0.25); head.add(mouth);
    const arms = [-1, 1].map(s => { const sh = new THREE.Group(); sh.position.set(s * 0.21, 0.86, 0.04); body.add(sh); sh.add(P(GEO.cyl, '#e2683f', [0, -0.15, 0], [0.065, 0.3, 0.065])); sh.add(P(GEO.sphere, '#f0c9a2', [0, -0.32, 0], [0.065, 0.065, 0.065], { ink: 0.008 })); return sh; });
    return { g, body, head, arms, mouth };
  }
  function clockFace(o = {}) {
    const r = o.r || 2.4, g = new THREE.Group();
    const face = new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ map: dialTex(), color: '#d9cfb6' })); g.add(face);
    // inside the dial: a window into the clock, where Noa stands (the dial's middle is cut away, dark)
    const well = new THREE.Mesh(new THREE.CircleGeometry(r * 0.56, 40), new THREE.MeshBasicMaterial({ color: '#141022' })); well.position.z = 0.01; g.add(well);
    const rimK = (rr, tube, col, z = 0.05) => { const m = part(new THREE.TorusGeometry(rr, tube, 10, 56), null, [0, 0, z], null, { mat: tmat(col), ink: 0.02 }); g.add(m); return m; };
    rimK(r, 0.2, '#5b4a3a', 0.08); rimK(r * 0.57, 0.07, '#8a6a40', 0.04);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, m = part(GEO.sphere, null, [Math.sin(a) * (r + 0.02), Math.cos(a) * (r + 0.02), 0.22], [0.12, 0.12, 0.08], { mat: tmat('#c9a24a'), ink: 0.008 }); g.add(m); }
    const noa = noaModel(); noa.g.scale.setScalar(r * 0.36); noa.g.position.set(0, -r * 0.5, -0.05); g.add(noa.g);
    const nglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#a7b6ff', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending })); nglow.scale.setScalar(r * 1.1); nglow.position.set(0, 0, 0.02); g.add(nglow);
    // the hands (on a pivot in front of the glass)
    const hands = new THREE.Group(); hands.position.z = 0.32; g.add(hands);
    const hand = (len, w, col) => { const pv = new THREE.Group(); hands.add(pv); pv.add(part(GEO.box, null, [0, len / 2, 0], [w, len, 0.05], { mat: tmat(col), ink: 0.01 })); pv.add(part(new THREE.ConeGeometry(w * 1.3, w * 2.6, 4), null, [0, len + w * 1.1, 0], null, { mat: tmat(col), ink: 0.008 })); return pv; };
    const hourH = hand(r * 0.5, 0.13, '#2e2738'), minH = hand(r * 0.78, 0.09, '#2e2738');
    hands.add(part(GEO.sphere, null, [0, 0, 0.04], [0.16, 0.16, 0.08], { mat: tmat('#c9a24a'), ink: 0.008 }));
    // the glass, with a gleam
    const glass = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 48), new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.14, depthWrite: false })); glass.position.z = 0.26; g.add(glass);
    const gleam = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.25, r * 1.4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.12, depthWrite: false })); gleam.position.set(-r * 0.4, r * 0.15, 0.27); gleam.rotation.z = 0.5; g.add(gleam);
    const C = { g, r, noa, hands, hourH, minH, glass, nglow, spin: 0, time: 11.95, beat: 1, glow: 0 };
    C.update = (dt, t) => {
      C.time += (C.spin || 0) * dt;
      minH.rotation.z = -((C.time % 1) * TAU); hourH.rotation.z = -((C.time / 12) % 1) * TAU;
      const n = C.noa, k = C.beat;       // Noa, pounding on the glass from inside
      n.arms.forEach((a, i) => { a.rotation.set(-2.2 + Math.sin(t * 7 + i * 1.6) * 0.35 * k, 0, (i ? -1 : 1) * 0.25); });
      n.body.position.y = Math.abs(Math.sin(t * 3.5)) * 0.04 * k; n.head.rotation.z = Math.sin(t * 2) * 0.06;
      nglow.material.opacity = 0.3 + 0.08 * Math.sin(t * 2.3) + C.glow;
    };
    return C;
  }

  // ------------------------------------------------------------ the Clock Room (oldtower.js's ninth room)
  let GAME = null;
  const hoodName = () => OTXT.pick(OTXT.NAMES.hood, lang());
  function buildTop(room, kit) {
    const R = room.R, g = room.g, Y0 = kit.Y0, RR = kit.RR, k = kit.Kit(), KG = kit.KG;
    // the great clock on the back wall, Noa in its face
    const C = clockFace({ r: 2.35 }); C.g.position.set(R.x, Y0 + 2.95, R.z - RR + 0.5); g.add(C.g); room.clock = C;
    k.box(R.x, Y0 + 0.3, R.z - RR + 0.7, 5.6, 0.6, 1.0, '#4a3a33', { ink: 0.02 });
    // gears round it, the cracked bell lying on its side, a stool and loose pages, a window full of night
    const gears = [];
    [[-3.5, 4.2, 0.9], [3.6, 4.0, 1.1], [-3.9, 1.8, 0.7], [3.9, 1.6, 0.6]].forEach(([dx, y, r]) => {
      const gg = new THREE.Group(); gg.position.set(R.x + dx, Y0 + y, R.z - RR + 0.55 + Math.abs(dx) * 0.12); g.add(gg);
      const gk = kit.Kit(); gk.add(KG.cyl, 0, 0, 0, r, 0.16, r, '#a87b3e', { rx: Math.PI / 2, ink: 0.014 }); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; gk.box(Math.sin(a) * r, Math.cos(a) * r, 0, r * 0.26, r * 0.26, 0.16, '#a87b3e', { rz: -a, ink: 0.008 }); } gk.build(gg, { shadow: false });
      gears.push(gg);
    });
    room.gears = gears;
    const bellGeo = new THREE.LatheGeometry([[0, 0], [1.2, 0], [1.15, 0.1], [0.99, 0.3], [0.79, 0.6], [0.67, 0.95], [0.61, 1.3], [0.57, 1.62], [0.49, 1.84], [0.33, 1.93], [0, 1.96]].map(([x, y]) => new THREE.Vector2(x, y)), 28);
    const bell = part(bellGeo, null, null, null, { mat: tmat('#a07246', { side: THREE.DoubleSide }), ink: 0.025 });
    bell.rotation.set(0, 0.4, 1.9); bell.position.set(R.x - 4.0, Y0 + 1.05, R.z - 2.2); bell.scale.setScalar(0.85); g.add(bell);
    k.add(KG.cyl, R.x + 3.8, Y0 + 0.45, R.z - 2.6, 0.25, 0.07, 0.25, '#7a5a40', { ink: 0.012 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; k.add(KG.cyl6, R.x + 3.8 + Math.sin(a) * 0.2, Y0 + 0.22, R.z - 2.6 + Math.cos(a) * 0.2, 0.03, 0.46, 0.03, '#6a4c36', { ink: 0.006 }); }
    [[0.9, 1.6, 0.4], [2.2, -0.6, -0.9], [-1.2, 1.2, 1.3], [1.6, 2.6, 2.2], [-2.6, 0.2, 0.7]].forEach(([dx, dz, r]) => k.box(R.x + dx, Y0 + 0.02, R.z + dz, 0.2, 0.01, 0.27, '#f3ead6', { ry: r, ink: 0 }));
    k.build(g);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), new THREE.MeshBasicMaterial({ map: TK.canvasTex(64, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d1236'); gr.addColorStop(1, '#3d4c8c'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#fff6dc'; for (let i = 0; i < 14; i++) c.fillRect((i * 37) % w, (i * 53) % (h * 0.7), 1.5, 1.5); c.fillStyle = '#2a2440'; c.fillRect(w / 2 - 2, 0, 4, h); c.fillRect(0, h * 0.45, w, 4); }) }));
    const wa = -2.1, wp = kit.at(R, wa, RR - 0.06); win.position.set(wp.x, Y0 + 2.6, wp.z); win.rotation.y = wa + Math.PI; g.add(win);
    const moon = kit.glow('#a9c2ff', 4.5, 0.35); moon.position.set(wp.x * 0.85 + R.x * 0.15, Y0 + 2.4, wp.z * 0.85 + R.z * 0.15); g.add(moon);
    // the hooded figure, his back to you, reading Noa's notebook by the clock
    const F = figure(); F.root.position.set(R.x + 0.5, Y0, R.z - 3.4); F.root.rotation.y = Math.PI; F.S.open = 1; g.add(F.root); room.fig = F;
    room.figSolid = { x: R.x + 0.5, z: R.z - 3.4, r: 0.6 }; WORLD.extra.push(room.figSolid);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - RR + 0.7, hw: 2.9, hd: 0.55, rot: 0 }, { x: R.x - 4.0, z: R.z - 2.2, r: 1.2 }]);
    // the gray mist round his feet
    room.mist = [];
    for (let i = 0; i < 10; i++) { const sp = kit.glow('#9893ad', 1.6 + (i % 3) * 0.5, 0.3); sp.material.blending = THREE.NormalBlending; const a = i / 10 * TAU; sp.position.set(R.x + 0.5 + Math.sin(a) * 1.2, Y0 + 0.25, R.z - 3.4 + Math.cos(a) * 1.0); g.add(sp); room.mist.push({ sp, a, ph: i * 0.7 }); }
    room.task = { x: R.x, z: R.z + 1.2 };
  }
  function updateTop(room, dt, t) {
    if (room.clock) room.clock.update(dt, t);
    if (room.fig) room.fig.pose(dt, t);
    if (room.gears) room.gears.forEach((g, i) => { g.rotation.z += dt * (i % 2 ? -0.05 : 0.04); });
    if (room.mist) room.mist.forEach(m => { const a = m.a + t * 0.15; m.sp.position.x = room.fig.root.position.x + Math.sin(a) * 1.3; m.sp.position.z = room.fig.root.position.z + Math.cos(a) * 1.1; m.sp.material.opacity = 0.22 + 0.08 * Math.sin(t + m.ph); });
  }
  const S = G => G.state.oldtower || (G.state.oldtower = {});
  // the first time up here: Noa in the clock, the figure turns, a few words; then the fight
  async function arrive(G, room) {
    GAME = G;
    if (G.state.flags.towerLost) return;
    busyNow = true;
    try {
      const sim = G.sim, R = room.R, F = room.fig, Y0 = 300;
      sim.lock = 1; sim.mimo.scared = 3;
      G.cam.override = { pos: V(R.x - 1.6, Y0 + 2.5, R.z + 6.2), look: V(R.x + 0.1, Y0 + 2.6, R.z - 5.6), dur: 1.0 };
      await STORY.wait(1.1);
      await STORY.you('Noa!');
      room.clock.beat = 1.8; room.clock.glow = 0.25;
      await STORY.sayAt({ x: R.x, y: Y0 + 1.4, z: R.z - 6.0, top: 1.4, name: 'Noa' }, 'ot.noa.help', 'Noa');
      room.clock.beat = 1; room.clock.glow = 0;
      // he turns round, slowly
      G.cam.override = { pos: V(R.x + 2.2, Y0 + 2.2, R.z + 1.2), look: V(F.root.position.x, Y0 + 1.5, F.root.position.z), dur: 0.9 };
      snd('tick'); await STORY.wait(0.6);
      await STORY.tween(1.3, k => { const e = k * k * (3 - 2 * k); F.root.rotation.y = lerp(Math.PI, 0.2, e); F.S.open = 1 - e; });
      F.S.eyes = 1.5; snd('tick');
      const fp = { x: F.root.position.x, y: Y0, z: F.root.position.z, top: 2.0, name: hoodName() };
      await STORY.sayAt(fp, 'ot.hood.shh', hoodName());
      await STORY.sayAt(fp, 'ot.hood.up', hoodName());
      await STORY.you('Let Noa go! And give her back her words!');
      await STORY.tween(0.5, k => { F.S.open = k; });
      await STORY.sayAt(fp, 'ot.hood.hurt', hoodName());
      await STORY.sayAt(fp, 'ot.hood.laugh', hoodName());
      await STORY.sayAt(fp, 'ot.hood.here', hoodName());
      await STORY.tween(0.4, k => { F.S.open = 1 - k; });
      sim.mimo.scared = 0; sim.mimoSay('!!', 1.4); snd('chirp');
      await STORY.you('We’re not going quiet. Right, {mimo}?');
      G.cam.override = null; sim.lock = 0;
      await fightNow(G, room);
    } finally { busyNow = false; }
  }
  // the fight, and what comes after it: the fall (or, if you ran, he waits by the clock)
  async function fightNow(G, room) {
    GAME = G; fellNow = false;
    const R = room.R, F = room.fig;
    const r = await G.fight({ boss: 'hooded', foes: [{ kind: 'hooded', color: 'white', size: 'big', giant: 1, hp: 12 }], place: { biome: 'cave', x: R.x, z: R.z } });     // (12: each of your words takes a real bite, before he takes it back)
    if (fellNow) { await afterFight(G); return r; }
    S(G).fled = true;
    if (F) { F.root.rotation.y = 0.2; F.S.open = 0; }
    STORY.think('He just stands by the great clock… waiting. Catch your breath, then face him again.', 5);
    return r;
  }
  async function afterFight(G) {
    G.state.flags.towerLost = true; S(G).fled = false;
    G.sim.lock = 1;
    await fallScene();
    OLDTOWER._.afterFall();
    G.sim.lock = 0;
    whiteOff();
    G.save();
  }
  async function again(G, room) { GAME = G; if (!G.state.flags.towerLost) STORY.think('He’s still there, by the great clock… waiting for you.', 4.5); }
  async function faceHim(G, room) {
    busyNow = true;
    try {
      const F = room.fig, fp = { x: F.root.position.x, y: 300, z: F.root.position.z, top: 2.0, name: hoodName() };
      await STORY.sayAt(fp, 'ot.hood.shh', hoodName());
      await fightNow(G, room);
    } finally { busyNow = false; }
  }
  function topInteractables(G, room) {
    if (G.state.flags.towerLost || busyNow || !room.fig) return [];
    const st = S(G), F = room.fig;
    if (st.fled || st.seen8) return [{ x: F.root.position.x, z: F.root.position.z + 1.7, y: 300, r: 2.6, label: 'Face him', run: () => faceHim(G, room) }];
    return [];
  }
  function topTarget(G, room) { return room.fig ? { x: room.fig.root.position.x, z: room.fig.root.position.z + 1.2, hint: '{mimo} growls at the hooded figure by the great clock.' } : null; }

  // ------------------------------------------------------------ the fight: a plug-in boss on battle/flow.js (BATTLE._.plugins)
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  let FX = null, fellNow = false;      // FX: this fight's things { f, turn, words, clock, noaSt }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plainWord = w => (isC() && typeof CJK !== 'undefined' ? CJK.plain(String(w || ''), { lang: lang(), cap: false }) : String(w || ''));
  const fightLine = key => { const T = OTXT.FIGHT[key]; return [T[lang()] || T.en, T.en]; };
  // the hooded figure is a species in every language's battle table (the parser's indexes are rebuilt the next time they're needed)
  function registerSpecies() {
    if (!_ || !_.LANGS) return;
    for (const [l, sp] of Object.entries(OTXT.SPECIES)) { const L = _.LANGS[l]; if (!L || !L.species) continue; if (!L.species.hooded) L.species.hooded = Object.assign({}, sp); delete L.I; delete L.CJ; }
  }
  // his model: battle/models.js builds and poses every kind through _.M, and 'hooded' is ours
  function hookModels() {
    const M = _ && _.M; if (!M || M.hoodedHooked) return; M.hoodedHooked = true;
    const build0 = M.build, pose0 = M.pose, bright0 = M.brighten, kind0 = M.kindOf;
    M.kindOf = k => (String(k || '') === 'hooded' ? 'hooded' : kind0(k));
    M.build = o => (o && o.kind === 'hooded' ? foeModel() : build0(o));
    M.pose = (h, F, t, dt) => (h && h.kind === 'hooded' ? foePose(h, F, t, dt) : pose0(h, F, t, dt));
    M.brighten = (h, k) => (h && h.kind === 'hooded' ? undefined : bright0(h, k));
  }
  function foeModel() { const f = figure(), s = 1.12; f.root.scale.setScalar(s); return Object.assign(f, { kind: 'hooded', scale: s, radius: 0.5 * s, height: 1.86 * s, parts: [], labelH: 2.25, hover: 0 }); }
  function foePose(h, F, t, dt) {
    if (F.hoodPose) Object.assign(h.S, F.hoodPose);
    h.S.lean = (F.lean || 0) * 0.4;
    h.body.scale.set(F.sx || 1, F.sy || 1, F.sx || 1);
    h.pose(dt, t);
  }
  // his label: his name and his hearts (no color or size: he isn't one of the Hush's creatures)
  function hookLabel() {
    const U = _ && _.UI; if (!U || !U.label || U.hoodedHooked) return; U.hoodedHooked = true;
    const label0 = U.label;
    U.label = function (f, html) { return label0.call(this, f, f && f.species === 'hooded' ? hoodLabel(f) : html); };
  }
  function hoodLabel(f) {
    const l = lang(), sp = OTXT.SPECIES[l] || OTXT.SPECIES.es;
    const name = isC() ? (typeof CJK !== 'undefined' ? CJK.html(sp.w, { lang: l }) : esc(sp.w)) : `<i>${{ es: 'el', pt: 'o', de: 'der' }[l] || ''}</i> ${esc(sp.w)}`;
    const pct = Math.round(100 * f.hp / Math.max(1, f.maxHp));
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${pct}%"></i><span>${f.hp}</span></div>`;
  }
  // the bestiary: a line about him, his name in English, his picture
  function hookBestiary() {
    if (!_) return;
    if (_.RW && _.RW.LORE && !_.RW.LORE['boss:hooded']) _.RW.LORE['boss:hooded'] = ['Nadie sabe quién es. Se lleva las palabras.', 'Ninguém sabe quem ele é. Ele leva as palavras.', 'Niemand weiß, wer er ist. Er nimmt die Wörter.',
      '[没有|méi yǒu] [人|rén] [知道|zhī dào] [他|tā] [是|shì] [谁|shéi] 。 [他|tā] [拿走|ná zǒu] [话|huà] 。', 'だれ も [彼|かれ] を [知|し]らない 。 [言葉|ことば] を [取|と]って いく 。', 'Nobody knows who he is. He takes words away.'];
    if (_.RW && _.RW.KIND_EN) _.RW.KIND_EN.hooded = 'hooded figure';
    if (_.UI && _.UI.ICON && !_.UI.ICON.hooded) _.UI.ICON.hooded = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6 C20 10 15 22 16 34 L10 58 L54 58 L48 34 C49 22 44 10 32 6 Z" fill="#6f6987" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="27" rx="10" ry="9" fill="#0c0912"/><circle cx="28" cy="27" r="2.2" fill="#eef4ff"/><circle cx="36" cy="27" r="2.2" fill="#eef4ff"/></svg>';
  }
  // a word as a sprite: yours (light) or the one he throws back (dark, with a pale edge)
  function wordSprite(text, dark) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '800 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text || '…').width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14;
    c.strokeStyle = dark ? '#d9cff5' : '#2b2235'; c.strokeText(text || '…', cv.width / 2, 54);
    c.fillStyle = dark ? '#1b1626' : '#fffaf0'; c.fillText(text || '…', cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    const h = 0.55, w = h * cv.width / cv.height; sp.scale.set(w, h, 1); sp.renderOrder = 12; sp.userData.w = w; sp.userData.h = h;
    return sp;
  }
  // the tear in the world: a jagged rift of white light
  function tearSprite() {
    const tex = TK.canvasTex(128, 256, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,236,170,0.9)'); g.addColorStop(0.7, 'rgba(150,140,255,0.4)'); g.addColorStop(1, 'rgba(40,30,80,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(w / 2, 4); for (let y = 4; y < h - 4; y += 14) c.lineTo(w / 2 + (y % 28 ? 22 : -10) * Math.sin(y / h * Math.PI), y); c.lineTo(w / 2, h - 4); for (let y = h - 4; y > 4; y -= 14) c.lineTo(w / 2 - (y % 28 ? 22 : -8) * Math.sin(y / h * Math.PI), y); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 10); for (let y = 10; y < h - 10; y += 18) c.lineTo(w / 2 + (y % 36 ? 6 : -6), y); c.stroke();
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.renderOrder = 11;
    return sp;
  }
  // a white veil over everything (the fight ends on it; the fall takes over from it)
  function whiteOn(ms = 500) {
    let el = document.getElementById('ot-white');
    if (!el) { el = document.createElement('div'); el.id = 'ot-white'; el.style.cssText = 'position:fixed;inset:0;z-index:58;background:#fffdf6;opacity:0;pointer-events:none;'; document.body.appendChild(el); }
    el.style.transition = `opacity ${ms}ms`; void el.offsetWidth; el.style.opacity = '1';
  }
  function whiteOff() { const el = document.getElementById('ot-white'); if (el) el.remove(); }
  const say = (K, st, key, dur, cls = 'foe shout boss') => { const [t, en] = fightLine(key); K.say(st, t, { cls, en, dur }); };
  const wordOf = r => (r && r.clauses && r.clauses[0] && (r.clauses[0].verbShow || '')) || (r && r.raw ? String(r.raw).replace(/[¡!¿?.,]/g, '').split(/\s+/)[0] : '') || '…';
  // The cave arena (battle/stage.js), dressed as the tower's top for this fight: its one merged mesh of stalactites, timbers,
  // rails and minecart hidden, and the clock room's beams, gears, the cracked bell and loose pages in their place (props: the
  // stage removes them after the fight). The rocks come back on the first frame outside the fight (frame(dt)).
  let hidRocks = null;
  function dressArena(ST) {
    const sc = ST.S && ST.S.scene; if (!sc || typeof OLDTOWER === 'undefined' || !OLDTOWER._ || !OLDTOWER._.Kit) return;
    restoreArena();
    hidRocks = sc.children.filter(o => o.isMesh && o.castShadow && o.receiveShadow && o.material && o.material.vertexColors && o.material.side !== THREE.BackSide);
    hidRocks.forEach(o => { o.visible = false; });
    const { Kit, KG } = OLDTOWER._, k = Kit(), g = new THREE.Group(), cx = 1.5, cz = -1.2, back = a => Math.sin(a) < 0.3;     // (+z is the camera's side)
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2; if (!back(a)) continue; k.box(cx + Math.cos(a) * 13.9, 3.6, cz + Math.sin(a) * 13.9, 0.55, 7.4, 0.55, '#5b4130', { ry: -a, ink: 0.015 }); }
    for (let i = 0; i < 40; i++) { const a = (i + 0.5) / 40 * TAU; if (!back(a)) continue; k.box(cx + Math.cos(a) * 13.7, 6.1, cz + Math.sin(a) * 13.7, 2.3, 0.42, 0.5, '#4d3a2c', { ry: -a + Math.PI / 2, ink: 0.012 }); }
    [[-1.2, 4.6, 1.5], [9.6, 4.0, 1.1], [-8.4, 3.2, 0.9]].forEach(([x, y, r]) => {
      const a = Math.atan2(-11 - cz, x - cx), d = Math.min(12.9, Math.hypot(x - cx, -11 - cz)), gx = cx + Math.cos(a) * d, gz = cz + Math.sin(a) * d, ry = -a - Math.PI / 2;
      k.add(KG.cyl, gx, y, gz, r, 0.2, r, '#a87b3e', { rx: Math.PI / 2, ry, ink: 0.014 });
      for (let t = 0; t < 10; t++) { const b = t / 10 * TAU; k.box(gx + Math.cos(ry) * Math.sin(b) * r, y + Math.cos(b) * r, gz - Math.sin(ry) * Math.sin(b) * r, r * 0.28, r * 0.28, 0.2, '#a87b3e', { ry, rz: -b, ink: 0.008 }); }
    });
    [[0.9, 2.6, 0.4], [-2.4, 1.4, -0.9], [-4.6, -2.2, 1.3], [8.2, 1.6, 2.2], [-1.0, -4.6, 0.7], [3.4, 3.4, 2.6]].forEach(([x, z, r]) => k.box(x, 0.02, z, 0.22, 0.01, 0.3, '#f3ead6', { ry: r, ink: 0 }));
    k.build(g);
    const bell = part(new THREE.LatheGeometry([[0, 0], [1.2, 0], [1.15, 0.1], [0.99, 0.3], [0.79, 0.6], [0.67, 0.95], [0.61, 1.3], [0.57, 1.62], [0.49, 1.84], [0.33, 1.93], [0, 1.96]].map(([x, y]) => new THREE.Vector2(x, y)), 28), null, null, null, { mat: tmat('#a07246', { side: THREE.DoubleSide }), ink: 0.025 });
    bell.rotation.set(0, -0.6, 1.9); bell.position.set(-8.6, 1.05, -9.6); bell.scale.setScalar(1.05); bell.castShadow = true; g.add(bell);
    ST.prop(g);
  }
  function restoreArena() { if (hidRocks) { hidRocks.forEach(o => { o.visible = true; }); hidRocks = null; } }

  const PLUG = {
    setup(K) {
      const { G, ST } = K, f = G.foes.find(x => x.species === 'hooded'); if (!f) { FX = null; return; }
      FX = { f, turn: 0, words: [], clock: null, noaSt: null };
      f.isBoss = true; f.hoodPose = { open: 0, raise: 0, reach: 0, eyes: 1.2 };
      try { dressArena(ST); } catch (e) { console.error('[oldtower] arena', e); restoreArena(); }
      // the great clock behind him, Noa in its face (a speaker for her bubble at its middle)
      const C = clockFace({ r: 2.2 }); C.g.position.set(5.8, 2.7, -6.3); C.g.rotation.y = -0.38; ST.prop(C.g); FX.clock = C;
      FX.noaSt = { kind: 'noa', x: 5.8, y: 1.7, z: -5.9, talk: 0, flash: 0 };
      ST.S.extra.push({ obj: new THREE.Object3D(), life: 1e9, max: 1e9, fn: (o, k, dt) => { if (dt) C.update(dt, G.t); } });
    },
    floor: f => (f && f.species === 'hooded' ? 1 : 0),
    async main(K) {
      const { G, A, ST } = K; if (!FX) return 'flee';
      const f = FX.f;
      G.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', A.mimo, f, { up: 1.0, dist: 11 });
      K.setMood(f, 'go', 2.5); K.tween(f.hoodPose, { eyes: 1.7 }, 0.5);
      say(K, f, 'come', 3.0); K.emit('boss', { foe: f });
      await K.wait(3.0);
      for (;;) {
        G.turn++; K.refreshLabels();
        if (FX.turn === 1) await noaCalls(K);
        const r = await K.askOrFlee('command');
        await K.perform(r);
        FX.turn++;
        const word = wordOf(r);
        if (FX.turn >= 3) { await finale(K, word); return 'lose'; }
        await takeWord(K, word);
        if (FX.turn === 1) { const [t, en] = fightLine('steal'); K.say(A.mimo, t, { cls: 'mimo', en, dur: 2.4 }); await K.wait(2.0); }
        await throwBack(K, word);
        ST.shot('wide');
      }
    },
    async foePhase(K) { if (FX) await throwBack(K, FX.words[FX.words.length - 1] || '…'); },
    async end(K, outcome) {
      if (fellNow) return;                     // (on white: the fall takes over from here)
      if (outcome === 'flee') await K.fleeScene(); else if (K.loseScene) await K.loseScene();
    },
  };
  // your word, taken: it flies out of Mimo into Noa's notebook, and his hearts come back («…Gracias.»)
  async function takeWord(K, word) {
    const { G, A, ST, UI } = K, f = FX.f, w = plainWord(word);
    ST.shot('focus', A.mimo, f, { up: 0.9, dist: 10 });
    K.setMood(f, 'go', 1.6); K.tween(f.hoodPose, { open: 1 }, 0.35);
    const spr = wordSprite(w, false), a = ST.worldOf(A.mimo, 'top'), b = ST.worldOf(f, 'book');
    ST.prop(spr); spr.position.copy(a); snd('swoosh');
    await K.along(0.95, u => { spr.position.lerpVectors(a, b, u); spr.position.y += Math.sin(u * Math.PI) * 0.9; spr.scale.set(spr.userData.w * (1 - u * 0.75), spr.userData.h * (1 - u * 0.75), 1); });
    ST.dropProp(spr); ST.star(b, '#c9b8ff', 0.9); snd('page');
    const gain = f.maxHp - f.hp; f.hp = f.maxHp; K.refreshLabels();
    UI.pop(ST.worldOf(f, 'top'), gain ? '+' + gain : '♥', G.t, { color: '#c9b8ff', size: 40, sub: 'HE TOOK THE WORD' });
    FX.words.push(w); K.emit('heal');
    await K.wait(0.5);
    say(K, f, 'thanks', 2.0, 'foe');
    await K.wait(1.7);
    K.tween(f.hoodPose, { open: 0 }, 0.4);
  }
  // …and thrown back at you: whispered where it's coming from (your own dodge words), then the word, dark, at you or Mimo
  async function throwBack(K, word) {
    const { G, A, ST, UI } = K, f = FX.f, w = plainWord(word);
    if (G.hearts <= 1) { const [t, en] = [lang() === 'de' ? 'Pst…' : isC() ? (lang() === 'zh' ? '[嘘|xū] …' : 'しーっ …') : 'Shh…', 'Shh…']; K.say(f, t, { cls: 'foe', en, dur: 1.6 }); await K.wait(1.2); return; }
    const high = Math.random() < 0.5, tgt = Math.random() < 0.5 ? A.mimo : A.you;
    const dw = G.L && G.L.dodgeWords ? G.L.dodgeWords(G.tier) : null, T = OTXT.FIGHT[high ? 'high' : 'low'];
    const where = (dw && (high ? dw.high : dw.low)) || T[lang()] || T.en;
    const txt = isC() ? `${word} … ${where}` : `«${w}»… ${where}`;
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    K.say(f, txt, { cls: 'foe shout boss', en: `“${w}”… ${T.en}`, dur: K.readTime(w + where) + 2.0 });
    K.emit('shout', { text: txt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(w + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    K.tween(f.hoodPose, { reach: 1 }, 0.2);
    const Tm = G.t + 0.8, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const dark = wordSprite(w, true), a = ST.worldOf(f, 'book'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(dark); dark.position.copy(a); snd('swoosh');
    await K.along(0.8, u => { dark.position.lerpVectors(a, b, u * 1.06); dark.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); dark.material.rotation = Math.sin(u * 12) * 0.12; });
    const grade = await tp;
    ST.dropProp(dark);
    K.dodgeResult(f, tgt, grade, 1, {});
    if (G.hearts < 1) { G.hearts = 1; UI.hearts(G.hearts, G.maxHearts, G.name); }
    K.tween(f.hoodPose, { reach: 0 }, 0.4);
    await K.wait(0.5);
  }
  // Noa, from inside the great clock
  async function noaCalls(K) {
    const { A, ST } = K, C = FX.clock;
    ST.shot('focus', A.you, FX.noaSt, { up: 1.4, dist: 12.5 });
    C.beat = 1.8; C.glow = 0.3;
    const [t, en] = fightLine('speak');
    K.say(FX.noaSt, t, { cls: 'coach', en, dur: 3.2 });
    await K.wait(3.0);
    C.beat = 1; C.glow = 0;
  }
  // the third word: he keeps it. «Basta.» He winds the great clock; its hands run backward; the world tears; he flings you in
  async function finale(K, word) {
    const { G, A, ST } = K, f = FX.f, C = FX.clock;
    await takeWord(K, word);
    say(K, f, 'enough', 2.2);
    await K.wait(1.9);
    ST.shot('focus', A.you, FX.noaSt, { up: 1.3, dist: 14 });
    await K.tween(f, { yaw: f.yaw + 2.0 }, 0.6);
    K.tween(f.hoodPose, { raise: 1, open: 1, eyes: 2 }, 0.7);
    snd('clockset'); snd('gears');
    for (let i = 0; i < 12; i++) { C.spin = -(0.6 + i * 0.95); snd('tick'); ST.shake(0.12 + i * 0.03, 0.08); await K.wait(Math.max(0.12, 0.38 - i * 0.022)); }
    if (ST.S.arena && ST.S.arena.uni && ST.S.arena.uni.uStain) K.tween(ST.S.arena.uni.uStain, { value: 1 }, 1.0, 'io');
    C.glow = 0.6; C.beat = 2.2;
    const tear = tearSprite(); ST.prop(tear); tear.position.set(0.9, 1.7, -0.7); tear.scale.set(0.1, 0.1, 1);
    snd('crack'); ST.shake(1.0, 0.9); K.emit('boss-phase', { phase: 9, foe: f });
    await K.along(0.8, u => { tear.scale.set(0.1 + u * 2.6, 0.1 + u * 4.4, 1); tear.material.rotation = u * 0.4; });
    await K.tween(f, { yaw: f.yaw - 2.0 }, 0.5);
    K.tween(f.hoodPose, { raise: 0, open: 0 }, 0.5);
    ST.shot('focus', A.mimo, f, { up: 0.9, dist: 9 });
    say(K, f, 'final', 4.0);
    await K.wait(3.8);
    K.tween(f.hoodPose, { reach: 1 }, 0.25);
    snd('swoosh'); snd('whimper');
    ST.shot('wide');
    fellNow = true;
    if (GAME) GAME.state.flags.towerLost = true;     // (main.js saves after the fight: a load from here is after the fall)
    const tpos = tear.position.clone();
    await Promise.all([A.you, A.mimo].map((st, i) => K.tween(st, { x: tpos.x, y: tpos.y - 0.5, z: tpos.z, sx: 0.12, sy: 0.12 }, 1.0 + i * 0.15, 'in')));
    whiteOn(450);
    await K.wait(0.8);
  }

  // ------------------------------------------------------------ the fall into the Past (a screen of its own)
  // Drawn on a canvas over everything, frame by frame from the game's loop (frame(dt), so tests can step it): the great clock
  // spinning backward and breaking apart, clocks, gears and calendar pages falling past, your stolen words, two tiny shapes
  // tumbling into the light; three captions (English, your words woven in); then «Continuará…» and «the Past is coming soon».
  let FALL = null;
  const FALL_T = 12.5;
  function fallScene() {
    return new Promise(res => {
      const el = document.createElement('div'); el.id = 'ot-fall';
      el.innerHTML = `<style>
#ot-fall { position: fixed; inset: 0; z-index: 60; background: #fffdf6; overflow: hidden; font-family: Bahnschrift, "Segoe UI", sans-serif; }
#ot-fall canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#ot-fall .bar { position: absolute; left: 0; right: 0; height: 12vh; background: #050409; }
#ot-fall .bar.t { top: 0; } #ot-fall .bar.b { bottom: 0; height: 16vh; }
#ot-fall .cap { position: absolute; left: 50%; bottom: 0; height: 16vh; width: min(900px, 90vw); transform: translateX(-50%); display: flex; align-items: center; justify-content: center; text-align: center;
  color: #f4ecdc; font-size: clamp(18px, 2.3vw, 26px); font-weight: 600; text-shadow: 0 2px 0 #000; opacity: 0; transition: opacity .5s; }
#ot-fall .cap .w { color: #ffd98a; border-bottom-color: #ffd98a; }
#ot-fall .end { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #f4ecdc; opacity: 0; transition: opacity 1.2s; pointer-events: none; }
#ot-fall .end .big { font: italic 700 clamp(44px, 7vw, 84px) Georgia, "Times New Roman", serif; color: #ffd98a; text-shadow: 0 4px 0 #000; }
#ot-fall .end .en { font-size: 16px; opacity: .7; }
#ot-fall .end .soon { margin-top: 26px; font-size: 18px; font-weight: 700; letter-spacing: .04em; }
#ot-fall .end .soon small { display: block; margin-top: 6px; font-size: 13px; font-weight: 600; opacity: .7; letter-spacing: 0; }
#ot-fall .end .key { margin-top: 18px; font-size: 13px; opacity: .6; }
#ot-fall .end .key kbd { border: 1.5px solid currentColor; border-radius: 5px; padding: 0 5px; }
</style><canvas></canvas><div class="bar t"></div><div class="bar b"></div><div class="cap"></div><div class="end"></div>`;
      document.body.appendChild(el);
      const R = rng(41), items = [];
      for (let i = 0; i < 46; i++) items.push({ kind: i % 3 === 0 ? 'gear' : i % 3 === 1 ? 'clock' : 'page', a: R() * TAU, r: 0.2 + R() * 0.9, z: 0.1 + R() * 1.0, spin: (R() - 0.5) * 4, rot: R() * TAU, s: 0.6 + R() * 0.8, n: 1 + ((R() * 31) | 0) });
      const known = typeof LEX !== 'undefined' ? LEX.taughtList().filter(id => id.startsWith('v.') || id.startsWith('w.')).slice(-12).map(id => LEX.form(id)) : [];
      const words = (FX ? FX.words : []).concat(known).filter(Boolean).slice(0, 14).map((w, i) => ({ w, a: i * 2.4, z: 0.15 + (i % 7) * 0.13, r: 0.3 + (i % 4) * 0.15 }));
      FALL = { el, cv: el.querySelector('canvas'), cap: el.querySelector('.cap'), end: el.querySelector('.end'), t: 0, items, words, res, capNow: -1, ended: false, endT: 0 };
      const key = e => { if (!FALL) return; if (['KeyE', 'Enter', 'Space', 'Escape'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (FALL.ended && FALL.t - FALL.endT > 0.8) finishFall(); else if (!FALL.ended) FALL.t = Math.max(FALL.t, FALL_T); } };
      FALL.key = key; addEventListener('keydown', key, true);
      whiteOff();
    });
  }
  function finishFall() {
    if (!FALL) return;
    const F = FALL; FALL = null;
    removeEventListener('keydown', F.key, true);
    F.el.style.transition = 'opacity .9s'; F.el.style.opacity = '0';
    setTimeout(() => F.el.remove(), 950);
    F.res();
  }
  const CAPS_AT = [[0.9, 4.0], [4.5, 7.7], [8.1, 11.6]];
  function frame(dt) {
    if (hidRocks) restoreArena();      // (main.js runs this only outside a fight: the cave arena gets its rocks back for the next one)
    if (!FALL) return;
    const F = FALL; F.t += Math.min(0.05, Math.max(0, dt || 0));
    const t = F.t;
    // the captions
    const ci = CAPS_AT.findIndex(([a, b]) => t >= a && t < b);
    if (ci !== F.capNow) { F.capNow = ci; if (ci >= 0) { F.cap.innerHTML = typeof UI !== 'undefined' && UI.weave ? UI.weave(OTXT.CAPS[ci]) : esc(OTXT.CAPS[ci]); F.cap.style.opacity = '1'; } else F.cap.style.opacity = '0'; }
    // the end: «Continuará…», and the Past is coming soon
    if (t >= FALL_T && !F.ended) {
      F.ended = true; F.endT = t;
      const l = lang(), cont = OTXT.pick(OTXT.NAMES.cont, l), past = OTXT.pick(OTXT.NAMES.past, l);
      F.end.innerHTML = `<div class="big">${esc(cont)}</div>${l !== 'en' ? '<div class="en">To be continued…</div>' : ''}<div class="soon">Chapter 2 · The Past («${esc(past)}»)${typeof PAST !== 'undefined' ? '' : ' · coming soon'}<small>${typeof PAST !== 'undefined' ? 'Noa is still in the great clock… and yesterday is waiting.' : 'Your game is saved. Noa is still in the great clock.'}</small></div><div class="key"><kbd>E</kbd> ▸</div>`;
      F.end.style.opacity = '1'; F.cap.style.opacity = '0';
      snd('bell');
    }
    if (F.ended && t - F.endT > 14) { finishFall(); return; }      // (it carries on by itself after a while)
    draw(F, t);
  }
  function draw(F, t) {
    const cv = F.cv, dpr = Math.min(1.5, window.devicePixelRatio || 1), W = Math.max(2, Math.round(innerWidth * dpr)), H = Math.max(2, Math.round(innerHeight * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d'), cx = W / 2, cy = H * 0.46, S = Math.min(W, H);
    // the background: from the white of the tear into a deep night, a gold light at the middle that shrinks to a point
    const fadeIn = smoothstep(0, 1.6, t), endK = smoothstep(9.4, 11.6, t);
    const bg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.75);
    bg.addColorStop(0, `rgba(255,${(214 + 30 * (1 - fadeIn)) | 0},${(140 + 100 * (1 - fadeIn)) | 0},1)`); bg.addColorStop(0.18 * (1 - endK) + 0.01, 'rgba(96,74,170,1)'); bg.addColorStop(1, '#07060f');
    c.globalAlpha = 1; c.fillStyle = bg; c.fillRect(0, 0, W, H);
    if (fadeIn < 1) { c.fillStyle = `rgba(255,253,246,${1 - fadeIn})`; c.fillRect(0, 0, W, H); }
    // speed streaks out from the middle
    c.save(); c.translate(cx, cy); c.strokeStyle = 'rgba(255,240,200,0.35)'; c.lineWidth = 2 * dpr;
    for (let i = 0; i < 48; i++) { const a = i * 2.39996, ph = (t * 0.9 + i * 0.137) % 1, r0 = S * (0.05 + ph * 0.9), r1 = r0 + S * 0.06 * (0.3 + ph); c.globalAlpha = (1 - endK) * 0.6 * ph; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
    c.restore();
    // the great clock: big at first, spinning backward, then it breaks into the falling clocks
    const big = 1 - smoothstep(2.6, 4.2, t);
    if (big > 0.01) {
      c.save(); c.translate(cx, cy); c.globalAlpha = big; const rr = S * (0.22 + 0.12 * smoothstep(0, 2.6, t));
      clockDraw(c, rr, -t * 6, -t * 0.9, true); c.restore();
    }
    // the falling things: clocks, gears, pages with days on them (they rush out past you)
    const pages = { es: ['lunes', 'martes', 'ayer', 'antes'], pt: ['segunda', 'terça', 'ontem', 'antes'], de: ['Montag', 'Dienstag', 'gestern', 'früher'], zh: ['昨天', '星期一', '以前', '过去'], ja: ['きのう', '月曜日', 'むかし', 'まえ'], en: ['Monday', 'yesterday', 'before', 'long ago'] }[lang()] || [];
    const go = smoothstep(2.2, 4.0, t) * (1 - endK);
    for (const it of F.items) {
      const z = 1 - ((it.z + t * 0.16) % 1), p = 1 / (0.12 + z * 1.6), x = cx + Math.cos(it.a) * it.r * S * 0.45 * p * 0.35, y = cy + Math.sin(it.a) * it.r * S * 0.45 * p * 0.35, s = S * 0.025 * it.s * p;
      if (s < 1 || go <= 0) continue;
      c.save(); c.translate(x, y); c.rotate(it.rot + t * it.spin); c.globalAlpha = go * Math.min(1, (1 - z) * 3) * 0.9;
      if (it.kind === 'clock') clockDraw(c, s, t * it.spin * 2, t * it.spin * 0.3, false);
      else if (it.kind === 'gear') gearDraw(c, s);
      else { c.fillStyle = '#f3ead6'; c.strokeStyle = INK; c.lineWidth = Math.max(1, s * 0.06); c.fillRect(-s * 0.7, -s, s * 1.4, s * 2); c.strokeRect(-s * 0.7, -s, s * 1.4, s * 2); c.fillStyle = '#c2412f'; c.fillRect(-s * 0.7, -s, s * 1.4, s * 0.45); c.fillStyle = INK; c.font = `700 ${Math.max(6, s * 0.75) | 0}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(it.n), 0, s * 0.25); c.font = `600 ${Math.max(5, s * 0.28) | 0}px "Segoe UI", sans-serif`; c.fillText(pages[it.n % pages.length] || '', 0, s * 0.78); }
      c.restore();
    }
    // your stolen words, drifting past
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const w of F.words) {
      const z = 1 - ((w.z + t * 0.11) % 1), p = 1 / (0.15 + z * 1.4), x = cx + Math.cos(w.a + t * 0.2) * w.r * S * 0.5 * p * 0.4, y = cy + Math.sin(w.a + t * 0.2) * w.r * S * 0.5 * p * 0.4;
      const fs = S * 0.018 * p; if (fs < 4) continue;
      c.globalAlpha = go * Math.min(1, (1 - z) * 2.5) * 0.85; c.font = `800 ${fs | 0}px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif`; c.lineWidth = fs * 0.18; c.strokeStyle = '#1b1626'; c.strokeText(w.w, x, y); c.fillStyle = '#e8e0ff'; c.fillText(w.w, x, y);
    }
    // you and Mimo, tumbling into the light, smaller and smaller
    const fall = smoothstep(1.2, 10.5, t), sz = S * 0.07 * (1 - fall * 0.92);
    if (sz > 0.6) {
      c.save(); c.globalAlpha = 1 - smoothstep(10.2, 11.2, t);
      [[-1, 0], [1, 1]].forEach(([sx, isMimo]) => {
        c.save(); c.translate(cx + sx * sz * 0.9 * (1 - fall), cy + Math.sin(t * 1.7 + sx) * sz * 0.2); c.rotate(t * (isMimo ? -1.6 : 1.2));
        c.fillStyle = '#2b2235';
        if (isMimo) { c.beginPath(); c.ellipse(0, 0, sz * 0.42, sz * 0.4, 0, 0, TAU); c.fill(); [-1, 1].forEach(e => { c.beginPath(); c.ellipse(e * sz * 0.2, -sz * 0.55, sz * 0.1, sz * 0.32, e * 0.3, 0, TAU); c.fill(); }); }
        else { c.beginPath(); c.arc(0, -sz * 0.55, sz * 0.24, 0, TAU); c.fill(); c.fillRect(-sz * 0.2, -sz * 0.32, sz * 0.4, sz * 0.62); c.fillRect(-sz * 0.45, -sz * 0.25, sz * 0.9, sz * 0.12); c.fillRect(-sz * 0.18, sz * 0.28, sz * 0.12, sz * 0.4); c.fillRect(sz * 0.06, sz * 0.28, sz * 0.12, sz * 0.4); }
        c.restore();
      });
      c.restore();
    }
    // the end: everything into one point of gold, then night
    if (endK > 0) { c.globalAlpha = endK; c.fillStyle = '#07060f'; c.fillRect(0, 0, W, H); const pr = S * 0.02 * (1 - smoothstep(10.8, 12.2, t)); if (pr > 0.3) { const g = c.createRadialGradient(cx, cy, 0, cx, cy, pr * 6); g.addColorStop(0, 'rgba(255,230,160,1)'); g.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, pr * 6, 0, TAU); c.fill(); } }
    c.globalAlpha = 1;
  }
  function clockDraw(c, r, minA, hourA, big) {
    c.fillStyle = '#efe4c8'; c.strokeStyle = INK; c.lineWidth = Math.max(1.5, r * 0.07);
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
    c.lineWidth = Math.max(1, r * 0.03);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.sin(a) * r * 0.82, -Math.cos(a) * r * 0.82); c.lineTo(Math.sin(a) * r * 0.94, -Math.cos(a) * r * 0.94); c.stroke(); }
    c.lineCap = 'round'; c.lineWidth = Math.max(1.5, r * 0.08);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(hourA) * r * 0.5, -Math.cos(hourA) * r * 0.5); c.stroke();
    c.lineWidth = Math.max(1, r * 0.05); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(minA) * r * 0.8, -Math.cos(minA) * r * 0.8); c.stroke();
    if (big) { c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(0, 0, r * 0.07, 0, TAU); c.fill(); }
  }
  function gearDraw(c, r) {
    c.fillStyle = '#b98a4a'; c.strokeStyle = INK; c.lineWidth = Math.max(1, r * 0.08); c.beginPath();
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, rr = i % 2 ? r * 0.78 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#5a3a24'; c.beginPath(); c.arc(0, 0, r * 0.28, 0, TAU); c.fill();
  }

  // ------------------------------------------------------------ the songs (the user's taste: funky game music; distinct from every other song)
  // 'ot_climb', the climb: clockwork jazz-funk in 7/8 (100 bpm, 14 sixteenths a bar; D dorian). A clock's tick for the hi-hat,
  //   a rimshot and a sidestick, a pizzicato-ish upright walking the odd bar, a Rhodes on the off-beats (Dm9 · Bbmaj7 · Gm9 ·
  //   A7sus), a celesta with a music-box hook (the old tower's tune, wound up and swinging); a gear's clank every four bars.
  //   Sections: A (the hook) · B (the Rhodes takes it, the celesta answers) · a 2-bar break of ticks alone.
  // 'boss_hooded', the hooded figure: liquid drum'n'bass at 172 (D minor): a two-step break, a reese bass with a sub under it,
  //   clock ticks for shakers, and the old tower's music box as the hook (sagging flat: the stolen voice); a dark pad; the drop
  //   adds a bright FM lead answering it (your words fighting back) and stabs. Intro 4 · drop 8 · breakdown 4 (ticks, the box,
  //   a riser) · drop 8; it loops from the first drop.
  (function songs() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    // ---- the climb (7/8)
    const BAR = 14;
    const CH7 = K.CH('D2: F3 A3 C4 E4, A#1: D3 F3 A3, G1: F3 A#3 D4 A4, A1: G3 C4 D4 E4');
    const HOOK7 = K.mel('D6/2 F6/2 A6/4 G6/2 F6/4 | E6/2 D6/2 C6/4 A5/6 | D6/2 F6/2 A6/4 C7/2 A6/2 G6/2 | F6/4 E6/4 D6/6');
    const ANS7 = K.mel('r/8 A5/2 C6/2 D6/2 | r/14 | r/8 C6/2 D6/2 F6/2 | r/14');
    const WALK = [[0, 0], [3, 7], [6, 12], [8, 10], [10, 7], [12, 5]];       // (each bar's walk, from its chord's root)
    Sound.addSong('ot_climb', { bpm: 100, len: BAR * 20, swing: 0.08, vol: 0.34, verb: 0.2, echo: 0.12, echoSteps: 4, tone: 5200, play(i, t, s16) {
      const bar = Math.floor(i / BAR), st = i % BAR, ch = CH7[bar % 4], sec = bar < 8 ? 'A' : bar < 16 ? 'B' : bar < 18 ? 'brk' : 'A2';
      // the tick-tock (a clock for a hat), the kick on 1 and the "and" of 3, a rim on 4 and on 11
      if (st % 2 === 0) K.tick(t, st % 4 === 0, st === 0 ? 1 : 0.7);
      if (sec === 'brk') { if (st === 0) K.clank(t, 0.8); return; }
      if (st === 0 || st === 7) K.kick(t, st ? 0.75 : 1);
      if (st === 10 && bar % 2) K.kick(t, 0.55);
      if (st === 4 || st === 11) K.rim(t, st === 11 ? 0.9 : 0.6);
      if (st === 13) K.sidestick(t, 0.35);
      if (st === 0 && bar % 4 === 0) K.clank(t, 0.55);
      // the walking upright
      for (const [at, iv] of WALK) if (st === at) K.upright(ch[0] + iv - (iv > 9 ? 12 : 0), t, at ? 0.75 : 1, s16 * (at === 0 ? 3 : 2));
      // the Rhodes on the off-beats
      if (st === 2 || st === 9) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.008, s16 * 4, 0.7, 0.9));
      // the music-box hook (A), the Rhodes takes it in B and the celesta answers
      const h = HOOK7[i % (BAR * 4)], a = ANS7[i % (BAR * 4)];
      if (sec === 'A' || sec === 'A2') { if (h) { K.celesta(h[0], t, 1, h[1] * s16 * 1.2); K.mbox(h[0] - 12, t + 0.01, 0.35, 0.1, h[1] * s16); } }
      else { if (h) K.epiano(h[0] - 12, t, h[1] * s16 * 0.9, 1.1, 1.3); if (a) K.celesta(a[0], t, 0.9, a[1] * s16 * 1.4); }
      if (st === 0 && bar % 8 === 0) K.crash(t, 0.4);
    } });
    // ---- the hooded figure (drum'n'bass, 172)
    const ROOT = [38, 34, 36, 33];                  // D2 · Bb1 · C2 · A1, a bar each
    const PADC = [[62, 65, 69], [58, 62, 65], [60, 64, 67], [57, 61, 64]];
    const BOXT = K.mel('A5/2 C6/2 D6/4 F6/2 E6/2 | D6/4 C6/2 A5/6 r/4 | A5/2 C6/2 D6/4 A6/2 G6/2 | F6/4 E6/4 D6/8');
    const LEADT = K.mel('r/8 D6/2 E6/2 F6/4 | A6/4 G6/2 F6/2 E6/4 D6/4 | r/8 F6/2 G6/2 A6/4 | C7/4 A6/4 D7/8');
    Sound.addSong('boss_hooded', { bpm: 172, len: 384, from: 64, swing: 0, vol: 0.48, verb: 0.12, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, r = ROOT[bar % 4], sec = bar < 4 ? 'in' : bar < 12 ? 'A' : bar < 16 ? 'brk' : 'B';
      const tickHi = st % 4 === 2;
      K.tick(t, tickHi, sec === 'brk' ? 0.9 : 0.55);
      if (sec === 'in' || sec === 'brk') {
        if (st === 0) K.darkpad(r + 12, t, s16 * 16, 0.9);
        if (st === 0 && bar % 2 === 0) PADC[bar % 4].forEach(m => K.darkpad(m - 12, t, s16 * 32, 0.5));
        const b = BOXT[i % 64]; if (b) K.mbox(b[0], t, 0.9, 0.35 + (sec === 'brk' ? 0.25 : 0), b[1] * s16 * 1.6);
        if (sec === 'in' && bar === 3 && st >= 8 && st % 2 === 0) K.gatesnare(t, 0.3 + (st - 8) * 0.08);
        if (sec === 'brk' && bar === 15) { if (st === 0) K.swell(t, s16 * 16, 1); if (st >= 8) K.gatesnare(t, 0.35 + (st - 8) * 0.06); }
        return;
      }
      // the break: a two-step (kick on 1 and the "and" of 3, the snare on 2 and 4), ghost snares, a shuffle of 909 hats
      if (st === 0 || st === 10) K.bigkick(t, st ? 0.85 : 1);
      if (st === 4 || st === 12) K.gatesnare(t, 0.95);
      if (st === 7 || st === 15) K.gatesnare(t, 0.22);
      if (st % 2 === 1) K.ch909(t, 0.5); if (st === 14) K.oh909(t, 0.4);
      if (st === 0 && bar % 8 === 4) K.crash(t, 0.55);
      // the reese and its sub
      if (st === 0) { K.reese(r, t, s16 * 7, 1); K.sub808(r, t, s16 * 7, 0.7); }
      if (st === 8) { K.reese(r + (bar % 2 ? 3 : 0), t, s16 * 5, 0.85); }
      if (st === 14) K.reese(r + 7, t, s16 * 1.6, 0.6);
      // the music box: the hook, sagging flat
      const b = BOXT[i % 64]; if (b) K.mbox(b[0], t, 1, 0.3, b[1] * s16 * 1.4);
      // B: your words answer (a bright FM lead) and stabs on the off-beats
      if (sec === 'B') {
        const n = LEADT[i % 64]; if (n) K.fmlead(n[0], t, n[1] * s16 * 0.95, 0.85, 2.2);
        if (st === 6 || st === 11) K.stab(PADC[bar % 4], t, s16 * 1.2, 0.8, 1.1);
      } else if (st === 0 && bar % 2 === 0) PADC[bar % 4].forEach(m => K.darkpad(m, t, s16 * 32, 0.45));
    } });
  })();

  // ------------------------------------------------------------ hook into the battle at load
  try { registerSpecies(); hookModels(); hookLabel(); hookBestiary(); if (_) { _.plugins = _.plugins || {}; _.plugins.hooded = PLUG; } } catch (e) { console.error('[oldboss] battle hooks', e); }
  // his voice (battle_fx.js's table, from here): low and breathy, a whisper more than a voice
  try { if (typeof BFX !== 'undefined' && BFX.VOICES && !BFX.VOICES.hooded) BFX.VOICES.hooded = { m: 57, vow: ['u', 'o', 'u'], len: 0.13, gap: 0.05, layer: 'breath' }; } catch (e) { /* (no battle sounds) */ }

  return {
    buildTop, updateTop, arrive, again, topInteractables, topTarget, figure, clockFace, frame,
    busy: () => busyNow || !!FALL,
    _: { PLUG, get FX() { return FX; }, get fell() { return fellNow; }, fallScene, finishFall, get FALL() { return FALL; }, whiteOn, whiteOff, fightNow, afterFight, registerSpecies, wordSprite, faceHim,
      t: { skipFall() { if (FALL) { FALL.t = FALL_T + 1; FALL.ended = true; FALL.endT = FALL.t - 1; finishFall(); } } } },
  };
})();
