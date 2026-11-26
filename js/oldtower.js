'use strict';
// The Old Tower (DESIGN.md 14.1 and 17.1; game/REGIONS.md): the end of Chapter 1. With all eight bells ringing, the door opens;
// you climb it floor by floor, one verb a floor, each in a whole sentence to Mimo, following Noa's echoes (her words, caught in
// the tower when she climbed it before you); at the top the hooded figure takes your words and flings you into the Past
// (oldtower_boss.js). Text: oldtower_text.js (OTXT).
//   Outdoors, at the tower itself (main.js draws it at WORLD.L.tower, y 6, ×2.3: the door is on its south face): the door with
//   its eight bell marks (one lights for each bell rung), a stone landing at the door's height, a stair down the crag to the
//   south (its foot wherever the ground is), Noa's bag on the landing, the old sign. After the fall: a tear in time in the door.
//   Inside: nine round rooms at y 300 (3 × 3, 30 apart; the registry is in SIDES.md), one at a time, walls facing in:
//     1 the Flooded Hall   «¡Nada hasta la cuerda!»      Mimo swims to the rope, pulls it: the trapdoor opens, a ladder drops
//     2 the Gear Room      «¡Empuja la piedra!»          a stone jams the gears (mixed foes jump you first)
//     3 the Dark Stairs    «¡Canta a los cristales!»     the crystals light up the stair, one by one
//     4 the Tree Room      «¡Trepa al árbol!»            a gray tree grows up through the tower; Mimo unlatches the trapdoor
//     5 the Fog Room       «¡Sopla la niebla!»           the Hush's fog hides the ladder (mixed foes first)
//     6 the Bird Loft      «¡Llama a los pájaros!»       hushed birds wake and pull the trapdoor's rope
//     7 the Hourglass Room «¡Cava en la arena!»          the great hourglass broke; the door is under the sand (mixed foes first)
//     8 the Hall of Shadows «¡Ilumina la puerta!»       the shadows hide the last door
//     9 the Clock Room: the great clock, Noa trapped in its face, the hooded figure (OLDBOSS.top)
//   Each floor: Noa's echo says the sentence while she does it (whole, English under, aloud), the box shows the frame and the
//   thing («¡Nada hasta la ___!» · cuerda), a right verb without the thing makes Mimo ask «…?» (say it whole), a wrong verb
//   plays its own little scene. Solved: the chime (BFX.solved), the way up opens with a "Climb" arrow, and the floor's bell mark
//   lights: the recap of that region's verb.
//   OLDTOWER.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · inside · OUTSIDE · outdoor(dt, t)
// Flags: oldDoor (the door opened), oldBag (Noa's bag), towerLost (the fall: oldtower_boss.js). Progress: state.oldtower.
const OLDTOWER = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, RR = 7, WH = 5.6, INK = '#2b2235';
  // (over the north-east woods past the Frost Peaks, where nobody walks: a room's floor is a platform, and anything standing
  // under one, asked for its ground without its own height, would end up on it)
  const ROOMS = [
    { id: 'flood', name: 'The Flooded Hall', x: 200, z: -330 },
    { id: 'gears', name: 'The Gear Room', x: 230, z: -330 },
    { id: 'stairs', name: 'The Dark Stairs', x: 260, z: -330 },
    { id: 'tree', name: 'The Tree Room', x: 200, z: -360 },
    { id: 'fog', name: 'The Fog Room', x: 230, z: -360 },
    { id: 'loft', name: 'The Bird Loft', x: 260, z: -360 },
    { id: 'sand', name: 'The Hourglass Room', x: 200, z: -390 },
    { id: 'shadows', name: 'The Hall of Shadows', x: 230, z: -390 },
    { id: 'clock', name: 'The Clock Room', x: 260, z: -390 },
  ];
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', 'the top'];
  // which region's bell each floor remembers (the recap), and the line its teacher said when you first heard the verb
  // (key: a list is tried in order; the Sunken Ruins' scenes were still being written, so those are the likely names)
  const RECAP = [
    { region: 'the Mirror Lake', who: 'Lalo', key: 'lalo.demo' }, { region: 'Molinar', who: 'Marga', key: 'farmer.demo' },
    { region: 'the Quarry Caves', who: 'Pío (Cande’s canary)', key: 'c.pioDemo' }, { region: 'the Bloom Gardens', who: 'Flora', key: 'f.demo' },
    { region: 'the Frost Peaks', who: 'Lía', key: 'l.demo' }, { region: 'Port Brisa', who: 'Marino', key: 'mn.demo' },
    { region: 'the Sunken Ruins', who: 'Tadeo', key: ['ruins.demo.dig', 'td.demo', 'tadeo.demo'] }, { region: 'the Gray Marsh', who: 'Lucero', key: 'marsh.demo.light' },
  ];
  const Cap = s => s.charAt(0).toUpperCase() + s.slice(1), poss = s => s + (/s$/.test(s) ? '’' : '’s');
  // mixed foes on the way up (floors 2, 5 and 7): kinds from every region, the ones this language's battle knows
  const AMBUSH = { 1: [['armadillo', 'yellow'], ['moth', 'red'], ['frog', 'green'], ['hushling', 'blue']],
    4: [['snowball', 'blue'], ['bee', 'yellow'], ['bat', 'red'], ['beetle', 'green']],
    6: [['crab', 'red'], ['worm', 'yellow'], ['shadow', 'blue'], ['bat', 'green'], ['moth', 'yellow'], ['hushling', 'red']] };
  const S = () => G.state.oldtower || (G.state.oldtower = {});
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const has = id => !!(typeof LEX !== 'undefined' && LEX.item(id));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const chime = () => { if (!(typeof BFX !== 'undefined' && BFX.solved && BFX.solved())) snd('chest'); };
  // Mimo's «¡Nada!» (zh / ja: the word in the mode, with a full-width ！ after characters)
  const ex = w => (isC() ? w + (/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]$/i.test(w) ? '!' : '！') : (lang() === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!');
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  // a lines.js line's first version in a language (zh / ja: the mode's plain text), or the English
  // (lines.js's are lists of versions; a region's own map, like PORT.LINES, may hold plain strings)
  const lineOf = key => { for (const k of [].concat(key || [])) { const Lx = (typeof LINES !== 'undefined' && LINES[k]) || (typeof PORT !== 'undefined' && PORT.LINES && PORT.LINES[k]); if (Lx) return Lx; } return null; };
  const lineText = (key, l) => { const Lx = lineOf(key); if (!Lx) return ''; const v = Lx[l] || Lx.en; return OTXT.fillSlots((Array.isArray(v) ? v[0] : v) || '', Lx[l] ? l : 'en'); };
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call', 'v.dig', 'v.light'];
  const verbs = () => VERBS.filter(has);
  let inside = false, cur = -1, quick = {}, lights = null, lightCol = null, lightK = 1, lightT = 1;
  const rooms = [];

  // ------------------------------------------------------------ a kit: pieces in vertex colors, merged, with one ink hull
  let VCM = null, HULLM = null;
  const kitMats = () => { if (!VCM) { VCM = TK.toon('#ffffff', { vc: 1, rim: 0.14 }); HULLM = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); } return { VCM, HULLM }; };
  const KG = { box: GEO.box, sphere: new THREE.SphereGeometry(1, 12, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 7), cone: new THREE.ConeGeometry(1, 1, 8), ico: GEO.ico1 || new THREE.IcosahedronGeometry(1, 1), dodec: new THREE.DodecahedronGeometry(1, 0) };
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function Kit() {
    const solid = [], hull = [];
    const k = {
      addM(geo, m, color, ink = 0.025) {
        solid.push({ geo, m, color });
        if (ink > 0) { m.decompose(_v, _q, _s); hull.push({ geo, m: m.clone().multiply(new THREE.Matrix4().makeScale(1 + 1.6 * ink / Math.max(0.03, _s.x), 1 + 1.6 * ink / Math.max(0.03, _s.y), 1 + 1.6 * ink / Math.max(0.03, _s.z))), color: INK }); }
        return k;
      },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) { return k.addM(geo, TK.M4(x, y, z, sx, sy, sz, o.ry || 0, o.rx || 0, o.rz || 0), color, o.ink === undefined ? 0.025 : o.ink); },
      box(x, y, z, w, h, d, color, o) { return k.add(KG.box, x, y, z, w, h, d, color, o); },
      rod(geo, a, b, r, color, ink = 0.02) {
        const d = _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length() || 1e-3, q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
        return k.addM(geo, new THREE.Matrix4().compose(V((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V(r, len, r)), color, ink);
      },
      build(parent, o = {}) {
        const M = kitMats(), out = [];
        if (solid.length) { const m = new THREE.Mesh(TK.merge(solid), o.mat || M.VCM); m.castShadow = o.shadow !== false; m.receiveShadow = true; parent.add(m); out.push(m); }
        if (hull.length && o.hull !== false) { const h = new THREE.Mesh(TK.merge(hull), M.HULLM); parent.add(h); out.push(h); }
        return out;
      },
    };
    return k;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); return sp; };
  const unsolid = o => { if (o) { o.x = o.z = 1e5; } };
  const tex = (w, h, fn, rx = 1, ry = 1) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

  // ------------------------------------------------------------ the door and its yard (outdoors, at the tower)
  // The tower is main.js's INTERLUDE.buildTower() group ('old-tower'): its door sits on the plinth (local y 5.6), on the face
  // that looks south (local z = 3.05·cos 15° + 0.04), 1.3 wide and 2.1 tall (local), all ×2.3. Everything here is placed from it.
  const Y = {};          // the yard's spots: door, landing, stair foot, bag, sign (filled by placeYard)
  const OUTSIDE = { x: WORLD.L.tower.x, z: WORLD.L.tower.z + 9.3, yaw: Math.PI };
  let yard = null;
  function placeYard() {
    const tw = G.w3d.scene.getObjectByName('old-tower'), T = WORLD.L.tower;
    const s = tw ? tw.scale.x : 2.3, gx = tw ? tw.position.x : T.x, gy = tw ? tw.position.y : 6, gz = tw ? tw.position.z : T.z;
    const r = (3.05 * Math.cos(Math.PI / 12) + 0.04) * s;
    Object.assign(Y, { s, gx, gy, gz, shaft: 3.05 * s, door: { x: gx, y: gy + 5.6 * s, z: gz + r, w: 1.3 * s, h: 2.1 * s } });
    const D = Y.door;
    Y.land = { x0: D.x - 4.4, x1: D.x + 4.4, z0: D.z - 0.6, z1: D.z + 5.2, y: D.y };      // the landing, at the door's height
    // the stair: from the landing's front edge straight down the crag to the ground (about one step up for every 1.6 along)
    const z0 = Y.land.z1, gAt = z => WORLD.terrainAt(D.x, z);
    let z1 = z0 + 4;
    while (z1 < z0 + 60 && D.y - gAt(z1) > (z1 - z0) * 0.88) z1 += 0.5;     // (steep, like a castle's: its foot lands in the marsh's yard, marsh.js YARD)
    Y.stair = { x: D.x, z0, z1, y0: D.y, y1: Math.min(D.y, gAt(z1) + 0.02), w: 3.4 };
    Y.foot = { x: D.x, z: z1 + 1.6 };
    Y.bag = { x: D.x + 2.7, z: D.z + 1.6 };
    Y.sign = { x: D.x - 3.2, z: Y.stair.z1 + 1.2 };
    Y.tear = { x: D.x, y: D.y + D.h * 0.45, z: D.z + 0.25 };
    Object.assign(OUTSIDE, { x: D.x, z: D.z + 2.6, yaw: Math.PI });     // (facing the door: a save made here loads with the camera out over the stair)
  }
  function buildYard() {
    if (yard || !G) return yard;
    placeYard();
    const scene = G.w3d.scene, g = new THREE.Group(); g.name = 'oldtower-yard'; scene.add(g);
    const D = Y.door, Ld = Y.land, St = Y.stair, k = Kit();
    const STONE = ['#8f8a9e', '#857f95', '#9893a8', '#7c768e'];
    // the landing: big flagstones on a block of stone that goes down into the crag
    k.box((Ld.x0 + Ld.x1) / 2, Ld.y - 2.6, (Ld.z0 + Ld.z1) / 2, Ld.x1 - Ld.x0, 5.2, Ld.z1 - Ld.z0, '#7a7489', { ink: 0.03 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) k.box(Ld.x0 + 1.1 + i * 2.2, Ld.y + 0.02, Ld.z0 + 0.9 + j * 1.9, 2.1, 0.08, 1.8, STONE[(i + j * 3) % 4], { ink: 0.008 });
    // a low parapet round the landing's sides (the front is the stair)
    for (const sx of [-1, 1]) { k.box(D.x + sx * 4.6, Ld.y + 0.45, (Ld.z0 + Ld.z1) / 2, 0.45, 0.9, Ld.z1 - Ld.z0, '#6f6982', { ink: 0.02 }); for (const zz of [Ld.z0 + 0.4, Ld.z1 - 0.3]) k.box(D.x + sx * 4.6, Ld.y + 1.05, zz, 0.6, 0.35, 0.6, '#655f78', { ink: 0.015 }); }
    // the stair: steps from the landing down to the ground (each one a platform of its own), on a slab, with side walls
    const n = Math.max(4, Math.round((St.y0 - St.y1) / 0.42)), run = (St.z1 - St.z0) / n, rise = (St.y0 - St.y1) / n;
    St.steps = [];
    for (let i = 0; i < n; i++) {
      const top = St.y0 - (i + 1) * rise, za = St.z0 + i * run;
      k.box(St.x, top - 0.6, za + run / 2, St.w, 1.2, run + 0.02, STONE[i % 4], { ink: 0.006 });
      St.steps.push({ box: [St.x - St.w / 2, St.x + St.w / 2, za, za + run + 0.01], top, solid: true });
    }
    k.rod(KG.box, [St.x, St.y0 - 1.6, St.z0], [St.x, St.y1 - 1.2, St.z1], St.w - 0.1, '#5f5a70', 0.0);
    for (const sx of [-1, 1]) {
      const a = [St.x + sx * (St.w / 2 + 0.25), St.y0 + 0.5, St.z0], b = [St.x + sx * (St.w / 2 + 0.25), St.y1 + 0.5, St.z1];
      k.rod(KG.box, a, b, 0.42, '#6f6982', 0.02);
      k.rod(KG.box, [a[0], a[1] - 1.6, a[2]], [b[0], b[1] - 1.3, b[2]], 0.5, '#5f5a70', 0.02);
    }
    // the foot: two old lantern posts and a few flagstones
    for (const sx of [-1, 1]) k.add(KG.cyl6, St.x + sx * 2.6, St.y1 + 1.2, St.z1 + 0.6, 0.13, 2.4, 0.13, '#3e3a48', { ink: 0.012 }).box(St.x + sx * 2.6, St.y1 + 2.5, St.z1 + 0.6, 0.42, 0.5, 0.42, '#4b4658', { ink: 0.012 });
    for (let i = 0; i < 6; i++) k.box(St.x + (i % 3 - 1) * 1.4, St.y1 + 0.03, St.z1 + 1.2 + (i > 2 ? 1.3 : 0), 1.25, 0.08, 1.15, STONE[i % 4], { ink: 0.006 });
    // the old sign by the foot of the stair
    k.add(KG.cyl6, Y.sign.x, WORLD.terrainAt(Y.sign.x, Y.sign.z) + 0.75, Y.sign.z, 0.07, 1.5, 0.07, '#5a3a24', { ink: 0.01 });
    k.build(g);
    // the door: two oak wings in an arch, iron bands, a ring; behind them the dark (when they open)
    const arch = (w, h) => { const s = new THREE.Shape(), r = w / 2; s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.lineTo(-r, 0); return s; };
    const dark = new THREE.Mesh(new THREE.ShapeGeometry(arch(D.w * 0.98, D.h * 0.99)), new THREE.MeshBasicMaterial({ color: '#06050a' }));
    dark.position.set(D.x, D.y, D.z + 0.06); g.add(dark);
    const wings = [-1, 1].map(sx => {
      const piv = grp(g, D.x + sx * D.w / 2, D.y, D.z + 0.12), wk = Kit(), hw = D.w / 2;
      const sq = D.h - hw;      // (the square part; the round top is a quarter disc on each wing)
      for (let p = 0; p < 3; p++) wk.box(-sx * (hw * (p + 0.5) / 3), sq / 2, 0, hw / 3 - 0.03, sq - 0.02, 0.14, ['#6a4a34', '#5f412d', '#735039'][p], { ink: 0.008 });
      const cap = new THREE.Mesh(new THREE.CircleGeometry(hw, 16, sx < 0 ? Math.PI / 2 : 0, Math.PI / 2), TK.toon('#5f412d', { rim: 0.1 })); cap.position.set(-sx * hw, sq, 0.02); piv.add(cap);
      for (const yy of [0.18, 0.5, 0.78]) wk.box(-sx * hw / 2, D.h * yy, 0.09, hw - 0.1, 0.12, 0.04, '#3b3640', { ink: 0.006 });
      wk.add(new THREE.TorusGeometry(1, 0.22, 6, 16), -sx * (hw - 0.32), D.h * 0.45, 0.14, 0.17, 0.17, 0.17, '#c9a24a', { ink: 0.006 });
      wk.build(piv, { shadow: false });
      piv.userData.sx = sx; return piv;
    });
    // the eight bell marks round the arch: gray until their bell rings, then gold
    const marks = [];
    const bellGeo = new THREE.LatheGeometry([[0, 0], [0.27, 0], [0.2, 0.1], [0.17, 0.3], [0.12, 0.4], [0, 0.42]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (0.06 + 0.88 * i / 7), rr = D.w / 2 + 0.95, cy = D.y + D.h - D.w / 2;
      const m = new THREE.MeshToonMaterial({ color: '#7d7790', gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
      const b = new THREE.Mesh(bellGeo, m); b.scale.setScalar(1.3); b.position.set(D.x + Math.cos(a) * rr, cy + Math.sin(a) * rr - 0.2, D.z + 0.2); g.add(b);
      const gl = glow('#ffd36a', 1.6, 0); gl.position.copy(b.position).add(V(0, 0.25, 0.15)); g.add(gl);
      marks.push({ b, m, gl, on: 0 });
    }
    // the inscription over the door («Ocho campanas. Una puerta.»), repainted when the language changes
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const itx = new THREE.CanvasTexture(cv); itx.anisotropy = 4;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.86), new THREE.MeshBasicMaterial({ map: itx, transparent: true })); plate.position.set(D.x, D.y + D.h + 1.55, D.z + 0.16); g.add(plate);
    const paintPlate = l => { const c = cv.getContext('2d'); c.clearRect(0, 0, 512, 96); c.fillStyle = 'rgba(58,52,72,0.92)'; c.fillRect(6, 6, 500, 84); c.strokeStyle = '#c9a24a'; c.lineWidth = 4; c.strokeRect(10, 10, 492, 76);
      const txt = lineText('ot.sign', l || lang());
      c.fillStyle = '#efe2bf'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 40; c.font = `700 ${fs}px Georgia, serif`; while (c.measureText(txt).width > 470 && fs > 18) { fs -= 2; c.font = `700 ${fs}px Georgia, serif`; } c.fillText(txt, 256, 50); itx.needsUpdate = true; };
    if (typeof SIGNS !== 'undefined' && SIGNS.board) SIGNS.board(paintPlate); else paintPlate();
    // the sign's board at the foot of the stair (the tower's name)
    const scv = document.createElement('canvas'); scv.width = 320; scv.height = 112; const stx = new THREE.CanvasTexture(scv);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.66), new THREE.MeshBasicMaterial({ map: stx, side: THREE.DoubleSide })); board.position.set(Y.sign.x, WORLD.terrainAt(Y.sign.x, Y.sign.z) + 1.5, Y.sign.z + 0.06); g.add(board);
    const paintBoard = l => { const c = scv.getContext('2d'); const text = OTXT.pick(OTXT.NAMES.tower, l || lang()); if (typeof SIGNS !== 'undefined' && SIGNS.paint) SIGNS.paint(c, 320, 112, { text, edge: '#4b4658', icon: 'tower' }); else { c.fillStyle = '#d6c7a4'; c.fillRect(0, 0, 320, 112); c.fillStyle = '#2b2235'; c.font = '700 34px Georgia'; c.textAlign = 'center'; c.fillText(text, 160, 66); } stx.needsUpdate = true; };
    if (typeof SIGNS !== 'undefined' && SIGNS.board) SIGNS.board(paintBoard); else paintBoard();
    // Noa's bag, dropped on the landing: a satchel with its strap, and a letter sticking out of it
    const bag = grp(g, Y.bag.x, Ld.y, Y.bag.z), bk = Kit();
    bk.box(0, 0.22, 0, 0.62, 0.44, 0.3, '#9b6a3e', { ink: 0.012 }).box(0, 0.42, 0.06, 0.64, 0.12, 0.34, '#7e5432', { ink: 0.01 }).box(0.04, 0.48, -0.02, 0.32, 0.22, 0.03, '#fbf6e7', { ink: 0.006, rz: 0.2 });
    bk.add(new THREE.TorusGeometry(1, 0.06, 6, 18, Math.PI), 0.32, 0.25, 0, 0.36, 0.5, 0.36, '#7e5432', { ry: Math.PI / 2, rz: -0.6, ink: 0.006 });
    bk.build(bag); bag.rotation.y = -0.5;
    const bagGlow = glow('#fff3b0', 1.2, 0.3); bagGlow.position.set(0, 0.5, 0); bag.add(bagGlow);
    // two lanterns on the parapet: dark until the door opens
    const lamps = [-1, 1].map(sx => { const l = glow('#ffcf6a', 2.2, 0); l.position.set(D.x + sx * 4.6, Ld.y + 1.55, Ld.z1 - 0.3); g.add(l); return l; });
    const footLamps = [-1, 1].map(sx => { const l = glow('#ffcf6a', 2.0, 0); l.position.set(St.x + sx * 2.6, St.y1 + 2.5, St.z1 + 0.6); g.add(l); return l; });
    // the tear in time, in the doorway (after the fall): a swirl of old gold and night blue
    const tearTex = TK.canvasTex(256, 256, (c, w, h) => {
      const gr = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.25, 'rgba(255,214,120,0.95)'); gr.addColorStop(0.55, 'rgba(120,120,230,0.75)'); gr.addColorStop(1, 'rgba(20,16,60,0)');
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 3; for (let k = 0; k < 7; k++) { c.beginPath(); for (let a = 0; a < 5.5; a += 0.08) { const rr = 8 + a * 18 + k * 2, x = w / 2 + Math.cos(a + k * 0.9) * rr, y = h / 2 + Math.sin(a + k * 0.9) * rr; a ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    });
    const tear = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ map: tearTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    tear.position.set(Y.tear.x, Y.tear.y, Y.tear.z); tear.scale.set(D.w * 0.62, D.h * 0.5, 1); tear.visible = false; g.add(tear);
    const tearGlow = glow('#ffe4a0', 7, 0); tearGlow.position.set(Y.tear.x, Y.tear.y, Y.tear.z + 0.3); g.add(tearGlow);
    // solids: the tower's shaft, the landing's parapets, the stair's side walls; floors: the landing and the stair (a ramp)
    const sideSolids = [], fk = Kit();
    for (const sx of [-1, 1]) {
      // (the landing's front, either side of the stair: a low wall, so nobody steps off into the crag)
      const fx0 = sx < 0 ? Ld.x0 : St.x + St.w / 2, fx1 = sx < 0 ? St.x - St.w / 2 : Ld.x1;
      sideSolids.push({ obox: 1, x: (fx0 + fx1) / 2, z: Ld.z1 - 0.15, hw: (fx1 - fx0) / 2, hd: 0.24, rot: 0 });
      fk.box((fx0 + fx1) / 2, Ld.y + 0.42, Ld.z1 - 0.15, fx1 - fx0, 0.84, 0.42, '#6f6982', { ink: 0.02 });
      sideSolids.push({ obox: 1, x: D.x + sx * 4.6, z: (Ld.z0 + Ld.z1) / 2, hw: 0.28, hd: (Ld.z1 - Ld.z0) / 2, rot: 0 });
      sideSolids.push({ obox: 1, x: St.x + sx * (St.w / 2 + 0.25), z: (St.z0 + St.z1) / 2, hw: 0.24, hd: (St.z1 - St.z0) / 2 - 0.5, rot: 0 });
    }
    fk.build(g);
    const doorSolid = { obox: 1, x: D.x, z: D.z - 0.05, hw: D.w / 2 + 0.1, hd: 0.3, rot: 0 };
    // The crag: a solid all round the tower's foot (marsh.js puts one big circle there; solids have no height, so a whole disc
    // would block the stair and the landing too). It becomes a ring of small solids round the same edge, open where the stair
    // comes up through it: the crag stays solid from the ground, and the way up is clear.
    let ringR = 0;
    for (const c of WORLD.colliders) if (!c.obox && Math.hypot(c.x - Y.gx, c.z - Y.gz) < 1 && c.r > Y.shaft + 1 && c.r < 30) { ringR = Math.max(ringR, c.r); c.r = 0.001; }
    const ring = [], rr = ringR || 13.2, nring = Math.ceil(TAU * rr / 1.4);
    for (let i = 0; i < nring; i++) { const a = i / nring * TAU, x = Y.gx + Math.sin(a) * rr, z = Y.gz + Math.cos(a) * rr; if (z > Y.gz && Math.abs(x - D.x) < St.w / 2 + 1.0) continue; ring.push({ x, z, r: 0.95, crag: true }); }
    WORLD.addSolids([{ x: Y.gx, z: Y.gz, r: Y.shaft - 0.15 }].concat(sideSolids, ring));
    WORLD.extra.push(doorSolid);
    WORLD.addPlatforms([{ box: [Ld.x0, Ld.x1, Ld.z0, Ld.z1], top: Ld.y, solid: true }].concat(St.steps));
    yard = { g, wings, marks, bag, bagGlow, lamps, footLamps, tear, tearGlow, doorSolid, open: 0, openT: 0, plate };
    applyYard();
    return yard;
  }
  // the yard as the save says it: the door open (the eighth bell opens it) or shut, the bag picked up, the marks lit, the tear
  const doorOpen = f => (f.bells || 0) >= 8 || !!f.oldDoor;
  function applyYard() {
    if (!yard) return;
    const f = G.state.flags;
    yard.open = yard.openT = doorOpen(f) ? 1 : 0;
    yard.bag.visible = !f.oldBag;
    yard.tear.visible = !!f.towerLost && !f.towerHealed;     // (towerHealed: the finale sealed the tear, finale.js)
    solidDoor(f);
  }
  function solidDoor(f) {
    if (doorOpen(f) && (!f.towerLost || f.towerHealed)) unsolid(yard.doorSolid);
    else if (yard.doorSolid.x > 1e4) { yard.doorSolid.x = Y.door.x; yard.doorSolid.z = Y.door.z - 0.05; }
  }
  // every frame, outdoors (main.js): the yard is drawn within 230 of the tower; the door swings, the marks glow, the tear turns
  function outdoor(dt, t) {
    if (!G || !yard) return;
    const Yu = G.sim.you, f = G.state.flags, near = Math.hypot(Yu.x - Y.door.x, Yu.z - Y.door.z) < 230;
    yard.g.visible = !(G.indoors && G.indoors()) && near;
    if (!yard.g.visible) return;
    // the eighth bell opens it (marsh.js's chapel rings it): it swings open wherever you're watching it from
    if (doorOpen(f) && !yard.openT) { yard.openT = 1; solidDoor(f); if (Math.hypot(Yu.x - Y.door.x, Yu.z - Y.door.z) < 120) { snd('gears'); snd('wood'); } }
    yard.open = damp(yard.open, yard.openT, 1.4, dt);
    yard.wings.forEach(w => { w.rotation.y = -w.userData.sx * yard.open * 1.75; });
    const lit = Math.min(8, f.bells || 0);
    yard.marks.forEach((m, i) => {
      m.on = damp(m.on, i < lit ? 1 : 0, 2, dt);
      m.m.color.set('#7d7790').lerp(new THREE.Color('#e9b949'), m.on); m.m.emissive.setRGB(0.5 * m.on, 0.34 * m.on, 0.05 * m.on);
      m.gl.material.opacity = m.on * (0.42 + 0.12 * Math.sin(t * 2 + i));
    });
    const lampK = doorOpen(f) ? 1 : 0;
    yard.lamps.concat(yard.footLamps).forEach((l, i) => { l.material.opacity = lampK * (0.55 + 0.1 * Math.sin(t * 3.1 + i * 1.7)); });
    if (yard.bag.visible) yard.bagGlow.material.opacity = 0.22 + 0.12 * Math.sin(t * 2.6);
    if (yard.tear.visible) { yard.tear.material.rotation = 0; yard.tear.rotation.z = -t * 0.9; const k = 1 + 0.04 * Math.sin(t * 2.3); yard.tear.scale.set(Y.door.w * 0.62 * k, Y.door.h * 0.5 * k, 1); yard.tearGlow.material.opacity = 0.55 + 0.15 * Math.sin(t * 1.7); }
    else yard.tearGlow.material.opacity = 0;
  }
  // the yard's things to press E on (a STORY.extra provider: outdoors only)
  function outdoorInteractables() {
    if (!yard || !yard.g.visible) return [];
    const f = G.state.flags, D = Y.door, list = [], bells = f.bells || 0, at = { x: D.x, z: D.z + 1.3, r: 2.6, y: D.y };
    const fin = typeof FIN !== 'undefined' && FIN && FIN.door ? FIN.door(at) : null;     // (Chapter 4's finale, finale.js: «Go up the tower»)
    if (fin) list.push(fin);
    else if (f.towerLost && !f.towerHealed) list.push(Object.assign({ label: typeof PAST !== 'undefined' && PAST.fromTower ? 'Step into the tear' : 'Look', run: tearNote }, at));     // (past.js: the Past is through it)
    else if (doorOpen(f)) list.push(Object.assign({ label: 'Go in', run: async () => { if (!f.oldDoor) await doorScene(); await enter(); } }, at));
    else list.push(Object.assign({ label: 'Look', run: async () => STORY.think(`The door is shut tight. Eight bell marks circle it, and ${bells} of them glow. All eight bells have to ring.`, 5) }, at));
    if (!f.oldBag) list.push({ x: Y.bag.x, z: Y.bag.z, r: 1.8, y: Y.land.y, label: 'Look', run: bagScene });
    list.push({ x: Y.sign.x, z: Y.sign.z + 0.6, r: 1.8, label: 'Read', run: readSign });
    return list;
  }
  async function readSign() {
    const l = lang();
    if (typeof SIGNS === 'undefined' || !SIGNS.read) { STORY.think(OTXT.pick(OTXT.NAMES.tower, l), 3); return; }
    await SIGNS.read({ tag: 'An old sign at the foot of the stair', lines: [{ text: OTXT.pick(OTXT.NAMES.tower, l), en: 'The Old Tower' }, { text: lineText('ot.sign', l), en: lineText('ot.sign', 'en') }] });
  }
  // the first time you reach the open door: its eight bell marks ring out one by one, the gray breathes out of it
  async function doorScene() {
    const f = G.state.flags, D = Y.door, sim = G.sim;
    sim.lock = 1;
    G.cam.override = { pos: V(D.x + 5.5, D.y + 2.4, D.z + 12), look: V(D.x, D.y + 2.6, D.z), dur: 1.0 };
    sim.mimoGo({ x: D.x - 1.4, z: D.z + 3.2 }, { x: D.x, z: D.z });
    await wait(1.1);
    for (let i = 0; i < 8; i++) { snd('bell'); const m = yard.marks[i]; if (m) G.w3d.fx.sparkle(m.b.position.x, m.b.position.y, m.b.position.z + 0.2, 8, ['#ffd166', '#fff3a0']); await wait(0.36); }
    snd('bigbell'); G.w3d.fx.puff(D.x, D.y + 1.4, D.z + 1.0, 26, 0.5, '#9c98ad');
    sim.mimo.scared = 3; snd('whimper');
    await wait(0.9);
    await STORY.you('The door is open… all eight {w.bell:pl} did this.');
    f.oldDoor = true;
    G.cam.override = null;
    await UI.chapter('The Old Tower', 'Eight bells · the door is open');
    await STORY.you('Noa came all this way alone… She’s up there, {mimo}. Let’s go!');
    sim.lock = 0; sim.mimoGo(null, null);
    G.save();
  }
  // (a STORY.extra tick: the first time you step onto the landing with the door open, its scene plays by itself)
  function yardTick(dt, Yu) {
    if (!yard || !yard.g.visible || !G) return;
    const f = G.state.flags;
    if (f.oldDoor || f.towerLost || !doorOpen(f) || STORY.busy) return;
    if (Yu.y > Y.land.y - 1 && Math.hypot(Yu.x - Y.door.x, Yu.z - Y.door.z) < 5.5) STORY.run(doorScene);
  }
  // Noa's bag on the landing: she was here
  async function bagScene() {
    const sim = G.sim;
    sim.lock = 1;
    sim.mimoGo({ x: Y.bag.x - 0.8, z: Y.bag.z + 0.7 }, Y.bag); await wait(0.6);
    sim.mimo.tiltT = 1.6; snd('chirp');
    await STORY.you('This is Noa’s bag! And these are my {w.letter:pl}… all of them. She kept them.');
    await STORY.you('She was right here, {mimo}. She went in… and never came out.');
    G.state.flags.oldBag = true; yard.bag.visible = false;
    UI.toast('You took Noa’s bag, with your letters in it');
    sim.lock = 0; sim.mimoGo(null, null);
    G.save();
  }
  // after the fall: the tear in the door, where the next chapter begins
  async function tearNote() {
    await STORY.you('A tear in time, where the door was… The {w.clock} flung us through one just like it.');
    if (typeof PAST !== 'undefined' && PAST.fromTower) { await PAST.fromTower(); return; }     // (the hand-off: the Past, past.js)
    await comingSoon();
  }

  // ------------------------------------------------------------ the rooms: round, stone walls facing in, plank floors
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const stone = tex(256, 256, c => {
      const R = rng(77); c.fillStyle = '#4a4558'; c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const off = (y % 2) * 32; c.fillStyle = ['#7b7590', '#6f6984', '#857f98', '#68627c', '#77718b'][(x * 3 + y * 5 + 10) % 5]; c.fillRect(x * 64 + off + 2, y * 32 + 2, 60, 28); }
      c.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 60; k++) c.fillRect(R() * 256, R() * 256, 6 + R() * 10, 2);
      c.fillStyle = 'rgba(30,26,40,0.25)'; for (let k = 0; k < 40; k++) c.fillRect(R() * 256, R() * 256, 3, 3);
    }, 6, 1.6);
    const planks = tex(256, 256, c => {
      c.fillStyle = '#5a4030'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8; i++) { c.fillStyle = ['#6b4a36', '#755240', '#5f412f', '#7d5a44'][i % 4]; c.fillRect(0, i * 32 + 2, 256, 29); const off = (i * 89) % 256; c.fillStyle = '#3e2c22'; c.fillRect(off, i * 32, 3, 32); }
    }, 3, 3);
    MAT = {
      wall: new THREE.MeshToonMaterial({ map: stone, gradientMap: TK.grad, side: THREE.BackSide }),
      floor: new THREE.MeshToonMaterial({ map: planks, gradientMap: TK.grad }),
      hole: new THREE.MeshBasicMaterial({ color: '#0b0910' }),
      water: new THREE.MeshToonMaterial({ color: '#3f6f8f', gradientMap: TK.grad, transparent: true, opacity: 0.86, emissive: new THREE.Color('#0b2433') }),
      ghost: new THREE.MeshBasicMaterial({ color: '#a8dcff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
    };
    return MAT;
  }
  const at = (R, a, r) => ({ x: R.x + Math.sin(a) * r, z: R.z + Math.cos(a) * r });     // a point by angle (0: the front, south)
  function shell(R, g, o = {}) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.CircleGeometry(RR, 40), M.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(R.x, Y0, R.z); floor.receiveShadow = true; g.add(floor);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(RR, RR, WH, 40, 1, true), M.wall); wall.position.set(R.x, Y0 + WH / 2, R.z); wall.receiveShadow = true; g.add(wall);
    const k = Kit();
    // the rim at the top of the wall, and ribs of dark timber up the back
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.55 + i * 0.1125), p = at(R, a, RR - 0.18); k.box(p.x, Y0 + WH / 2, p.z, 0.3, WH, 0.3, '#4a3a33', { ry: a, ink: 0.015 }); }
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, p = at(R, a, RR - 0.2); k.box(p.x, Y0 + WH - 0.12, p.z, 2 * Math.PI * RR / 24 + 0.05, 0.26, 0.4, '#3d3242', { ry: a, ink: 0 }); }
    // the hatch you came up through, at the front
    k.box(R.x, Y0 + 0.03, R.z + 5.0, 2.0, 0.06, 1.5, '#3e2c22', { ink: 0.01 });
    k.build(g);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), M.hole); hole.rotation.x = -Math.PI / 2; hole.position.set(R.x, Y0 + 0.07, R.z + 5.0); g.add(hole);
    // the floor's bell mark on the back wall (gray, then gold when the floor's verb has worked), with a little plaque under it
    const markMat = new THREE.MeshToonMaterial({ color: '#7d7790', gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
    const bellGeo = new THREE.LatheGeometry([[0, 0], [0.42, 0], [0.3, 0.15], [0.26, 0.44], [0.18, 0.6], [0, 0.62]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
    const mp = at(R, Math.PI, RR - 0.16), mark = new THREE.Mesh(bellGeo, markMat); mark.position.set(mp.x, Y0 + 3.3, mp.z); g.add(mark);
    const mk = Kit(); mk.add(KG.cyl, mp.x, Y0 + 3.62, mp.z + 0.02, 0.62, 0.06, 0.62, '#5a5368', { rx: Math.PI / 2, ink: 0.012 }); mk.box(mp.x, Y0 + 2.45, mp.z + 0.05, 1.3, 0.42, 0.06, '#8b7a54', { ink: 0.01 }); mk.build(g);
    const markGlow = glow('#ffd36a', 2.4, 0); markGlow.position.set(mp.x, Y0 + 3.6, mp.z + 0.3); g.add(markGlow);
    // solids: a ring of short walls; the floor
    const segs = 24, sl = TAU * (RR + 0.3) / segs;
    const ring = []; for (let i = 0; i < segs; i++) { const a = (i / segs) * TAU, p = at(R, a, RR + 0.3); ring.push({ obox: 1, x: p.x, z: p.z, hw: sl / 2 + 0.1, hd: 0.3, rot: a }); }
    WORLD.addSolids(ring);
    WORLD.addPlatforms([{ box: [R.x - RR, R.x + RR, R.z - RR, R.z + RR], top: Y0 }]);
    return { mark, markMat, markGlow, markAt: { x: mp.x, z: mp.z + 1.4 } };
  }
  // ------------------------------------------------------------ the way up: a trapdoor in the ceiling, a ladder that drops (mill.js's way)
  const LEAN = 0.18;
  const ARROW = {};     // (one texture per word: 'Climb' for ladders and stairs, 'Go' for a door)
  const arrowTex = (word = 'Climb') => ARROW[word] || (ARROW[word] = TK.canvasTex(128, 160, c => {
    c.fillStyle = '#ffd34d'; c.strokeStyle = INK; c.lineWidth = 7; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(64, 10); c.lineTo(112, 62); c.lineTo(82, 62); c.lineTo(82, 104); c.lineTo(46, 104); c.lineTo(46, 62); c.lineTo(16, 62); c.closePath(); c.stroke(); c.fill();
    c.font = '900 30px "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.lineWidth = 8; c.strokeText(word, 64, 148); c.fillStyle = '#fffaf0'; c.fillText(word, 64, 148);
  }));
  function wayUp(room, x, z, o = {}) {
    const g = room.g, top = Y0 + WH - 0.12, len = WH - 0.12;
    const fr = grp(g, x, top, z);
    [[0, -0.95, 2.1, 0.2], [0, 0.95, 2.1, 0.2], [-0.95, 0, 0.2, 1.7], [0.95, 0, 0.2, 1.7]].forEach(([dx, dz, w, d]) => fr.add(part(GEO.box, '#4d3a2c', [dx, 0, dz], [w, 0.26, d], { ink: 0.01 })));
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ color: '#0d0a10', side: THREE.DoubleSide })); hole.rotation.x = Math.PI / 2; hole.position.y = 0.06; hole.visible = false; fr.add(hole);
    const lid = grp(fr, 0, -0.03, -0.85);
    lid.add(part(GEO.box, '#7a5a40', [0, 0, 0.85], [1.7, 0.1, 1.7], { ink: 0.012 }));
    [-0.45, 0.45].forEach(dx => lid.add(part(GEO.box, '#5b4130', [dx, -0.07, 0.85], [0.14, 0.05, 1.6], { ink: 0 })));
    const lad = grp(g, x, top, z + 0.1);
    [-0.42, 0.42].forEach(dx => lad.add(part(GEO.box, '#a8743f', [dx, -len / 2, 0], [0.12, len, 0.12], { ink: 0.01 })));
    for (let k = 0; k < 9; k++) lad.add(part(GEO.box, '#c79d6d', [0, -0.45 - k * 0.58, 0], [0.84, 0.09, 0.1], { ink: 0.008 }));
    lad.rotation.x = -LEAN; lad.scale.y = 0.001; lad.visible = false;
    const foot = { x, z: z + 0.1 + len * Math.sin(LEAN) };
    const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex(), transparent: true, depthWrite: false, depthTest: false }));
    arrow.scale.set(0.95, 1.2, 1); arrow.position.set(foot.x, Y0 + 2.1, foot.z + 0.2); arrow.visible = false; arrow.renderOrder = 5; g.add(arrow);
    room.way = { fr, lid, hole, lad, arrow, x, z, foot, open: false, kind: 'ladder', label: o.label || 'Climb the ladder' };
    room.up = { x: foot.x, z: foot.z + 0.6 };
    return room.way;
  }
  // a way up that isn't a ladder (the dark stairs, the buried door, the shadows' door): an arrow at a spot, opened by its own scene
  function wayAt(room, x, z, label, y = 2.1) {
    const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex(/door|the top/i.test(label) ? 'Go' : 'Climb'), transparent: true, depthWrite: false, depthTest: false }));
    arrow.scale.set(0.95, 1.2, 1); arrow.position.set(x, Y0 + y, z); arrow.visible = false; arrow.renderOrder = 5; room.g.add(arrow);
    room.way = { arrow, x, z, foot: { x, z }, open: false, kind: 'spot', label };
    room.up = { x, z: z + 0.8 };
    return room.way;
  }
  async function openWay(room, instant) {
    const w = room && room.way; if (!w || w.open) return; w.open = true;
    if (w.kind !== 'ladder') { w.arrow.visible = true; if (!instant) chime(); return; }
    w.hole.visible = true; w.lad.visible = true;
    if (instant) { w.lid.rotation.x = Math.PI / 2 * 0.97; w.lad.scale.y = 1; w.arrow.visible = true; return; }
    chime();
    await tween(0.45, k => { w.lid.rotation.x = Math.PI / 2 * 0.97 * k * k; });
    snd('wood'); snd('swoosh');
    await tween(0.6, k => { w.lad.scale.y = Math.max(0.001, k * k); });
    snd('land', 11); G.w3d.fx.puff(w.foot.x, Y0 + 0.1, w.foot.z, 12, 0.32, '#c9bfae');
    await tween(0.2, k => { w.lad.scale.y = 1 + Math.sin(k * Math.PI) * 0.035; });
    w.lad.scale.y = 1; w.arrow.visible = true;
  }

  // ------------------------------------------------------------ Noa's echo: her shape in pale light, where she once stood
  function echoFigure(parent) {
    const M = mats().ghost, root = new THREE.Group(), body = new THREE.Group(); root.add(body); parent.add(root);
    const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 16);
    body.add(new THREE.Mesh(lathe([[0, 0], [0.3, 0.02], [0.3, 0.3], [0.22, 0.66], [0.17, 0.88], [0.08, 0.96], [0, 0.97]]), M));
    const head = new THREE.Group(); head.position.y = 0.98; body.add(head);
    const hm = new THREE.Mesh(GEO.sphere, M); hm.scale.set(0.26, 0.26, 0.25); hm.position.y = 0.2; head.add(hm);
    const tail = new THREE.Mesh(KG.cone, M); tail.scale.set(0.1, 0.36, 0.1); tail.position.set(0, 0.24, -0.3); tail.rotation.x = 2.5; head.add(tail);   // her ponytail
    const arms = [-1, 1].map(s => { const sh = new THREE.Group(); sh.position.set(s * 0.22, 0.84, 0.03); body.add(sh); const a = new THREE.Mesh(GEO.cyl, M); a.scale.set(0.06, 0.32, 0.06); a.position.y = -0.16; sh.add(a); return sh; });
    const halo = glow('#9fd2ff', 2.6, 0); halo.position.y = 0.9; root.add(halo);
    root.visible = false; root.scale.setScalar(1.08);
    return { root, body, head, arms, halo, k: 0, pose: 'idle', t: 0 };
  }
  function poseEcho(E, dt, t) {
    if (!E || !E.root.visible) return;
    const M = mats().ghost; M.opacity = 0.42 * E.k; E.halo.material.opacity = 0.5 * E.k;
    E.t += dt; const p = E.pose;
    E.body.position.y = Math.sin(t * 1.6) * 0.05 + 0.04;
    const swing = Math.sin(E.t * 6) * 0.5;
    E.arms[0].rotation.set(p === 'sing' ? -2.6 : p === 'push' ? -1.4 : p === 'swim' ? -1.2 + swing : p === 'climb' ? -2.8 + swing * 0.3 : p === 'call' ? -2.9 : p === 'dig' ? -0.9 + swing : p === 'light' ? -2.4 : p === 'blow' ? -0.6 : -0.3, 0, 0.15);
    E.arms[1].rotation.set(p === 'sing' ? -2.6 : p === 'push' ? -1.4 : p === 'swim' ? -1.2 - swing : p === 'climb' ? -2.8 - swing * 0.3 : p === 'call' ? -0.4 : p === 'dig' ? -0.9 - swing : p === 'light' ? -0.4 : p === 'blow' ? -0.6 : -0.3, 0, -0.15);
    E.body.rotation.x = p === 'push' ? 0.35 : p === 'dig' ? 0.5 : p === 'blow' ? 0.15 : 0;
    E.head.rotation.x = p === 'sing' || p === 'call' ? -0.35 : p === 'scared' ? 0.25 : 0;
    if (p === 'scared') E.body.rotation.z = Math.sin(t * 20) * 0.03;
  }
  async function echoIn(E, x, z, yaw, pose) {
    E.root.position.set(x, Y0, z); E.root.rotation.y = yaw; E.pose = pose || 'idle'; E.root.visible = true; E.t = 0;
    snd('chime');
    await tween(0.8, k => { E.k = k; });
  }
  async function echoOut(E) { if (!E || !E.root.visible) return; await tween(1.0, k => { E.k = 1 - k; }); E.root.visible = false; E.k = 0; }

  // ------------------------------------------------------------ the floors' things
  // a gear wheel (a group turning about z): teeth round a disc
  function gear(parent, x, y, z, r, col = '#b98a4a', teeth = 10) {
    const g = grp(parent, x, y, z), k = Kit();
    k.add(KG.cyl, 0, 0, 0, r, 0.18, r, col, { rx: Math.PI / 2, ink: 0.015 }).add(KG.cyl, 0, 0, 0.06, r * 0.28, 0.22, r * 0.28, '#6b4a30', { rx: Math.PI / 2, ink: 0.01 });
    for (let i = 0; i < teeth; i++) { const a = (i / teeth) * TAU; k.box(Math.sin(a) * r, Math.cos(a) * r, 0, r * 0.26, r * 0.26, 0.18, col, { rz: -a, ink: 0.01 }); }
    k.build(g, { shadow: false });
    return g;
  }
  const crystalMat = () => new THREE.MeshToonMaterial({ color: '#4c5a6e', gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
  function crystal(parent, x, y, z, s) {
    const m = crystalMat(), cg = grp(parent, x, y, z);
    [[0, 0.5, 0, 0.22, 0.6, 0], [0.18, 0.32, 0.06, 0.14, 0.4, -0.4], [-0.16, 0.28, -0.04, 0.12, 0.34, 0.5]].forEach(([dx, dy, dz, r, h, rz]) => {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), m); c.scale.set(r * s, h * s, r * s); c.position.set(dx * s, dy * s, dz * s); c.rotation.z = rz; cg.add(c);
      c.add(new THREE.Mesh(c.geometry, TK.outlineMat ? TK.outlineMat(0.02) : new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })));
    });
    const gl = glow('#8ff8ff', 1.6 * s, 0); gl.position.y = 0.45 * s; cg.add(gl);
    return { g: cg, m, gl, lit: 0, want: 0 };
  }
  function bird(parent, x, y, z, col) {
    const b = grp(parent, x, y, z), body = new THREE.MeshToonMaterial({ color: '#8f8a9c', gradientMap: TK.grad }), wing = new THREE.MeshToonMaterial({ color: '#77728a', gradientMap: TK.grad });
    const P = (geo, mat, pos, sc, rot) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.scale.set(...sc); if (rot) m.rotation.set(...rot); m.add(new THREE.Mesh(geo, TK.outlineMat ? TK.outlineMat(0.012) : new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }))); b.add(m); return m; };
    P(GEO.sphere, body, [0, 0.16, 0], [0.16, 0.14, 0.22]);
    P(GEO.sphere, body, [0, 0.3, 0.16], [0.11, 0.11, 0.11]);
    const beak = new THREE.Mesh(KG.cone, new THREE.MeshToonMaterial({ color: '#e0a640', gradientMap: TK.grad })); beak.scale.set(0.04, 0.09, 0.04); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.29, 0.29); b.add(beak);
    const wings = [-1, 1].map(s => P(GEO.sphere, wing, [s * 0.15, 0.18, -0.02], [0.05, 0.1, 0.18]));
    P(GEO.box, wing, [0, 0.16, -0.24], [0.12, 0.03, 0.14], [0.3, 0, 0]);
    return { g: b, body, wing, wings, col, home: V(x, y, z), wake: 0, fly: 0 };
  }
  // a shadow on the wall: a dark blob with two pale eyes
  let SHADOW_TEX = null;
  const shadowTex = () => SHADOW_TEX || (SHADOW_TEX = TK.canvasTex(128, 128, c => {
    const gr = c.createRadialGradient(64, 70, 6, 64, 70, 60); gr.addColorStop(0, 'rgba(14,10,22,0.95)'); gr.addColorStop(0.7, 'rgba(20,16,30,0.75)'); gr.addColorStop(1, 'rgba(20,16,30,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#d7e3ff'; [46, 82].forEach(x => { c.beginPath(); c.ellipse(x, 60, 7, 10, 0, 0, TAU); c.fill(); });
  }));
  const BUILD = [
    // 1 · the Flooded Hall: dark water over most of the floor, a rope on the far side, its other end on the trapdoor's latch
    room => {
      const R = room.R, g = room.g, k = Kit(), M = mats();
      room.pool = { x: R.x + 0.6, z: R.z - 1.8, r: 4.5 };
      const water = new THREE.Mesh(new THREE.CircleGeometry(room.pool.r, 40), M.water); water.rotation.x = -Math.PI / 2; water.position.set(room.pool.x, Y0 + 0.06, room.pool.z); g.add(water); room.water = water;
      for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, x = room.pool.x + Math.sin(a) * (room.pool.r + 0.12), z = room.pool.z + Math.cos(a) * (room.pool.r + 0.12); if (Math.hypot(x - R.x, z - R.z) > RR - 0.5) continue; k.add(KG.dodec, x, Y0 + 0.08, z, 0.34, 0.14, 0.26, i % 2 ? '#6f6982' : '#7b7590', { ry: a, ink: 0.01 }); }
      room.rope = { x: R.x + 0.6, z: R.z - 6.1 };
      const pul = [room.rope.x, Y0 + 5.2, room.rope.z];
      k.add(new THREE.TorusGeometry(1, 0.3, 6, 14), pul[0], pul[1], pul[2], 0.3, 0.3, 0.3, '#5d4a3a', { ink: 0.01 });
      k.rod(KG.cyl6, pul, [R.x - 4.4, Y0 + 5.4, R.z + 1.0], 0.045, '#b5986a', 0.006);
      k.build(g);
      const rope = grp(g, room.rope.x, Y0, room.rope.z); rope.add(part(KG.cyl6, '#b5986a', [0, 2.75, 0], [0.05, 4.9, 0.05], { ink: 0.006 })); rope.add(part(GEO.sphere, '#a3865a', [0, 0.38, 0], [0.12, 0.16, 0.12], { ink: 0.008 }));
      room.ropeG = rope;
      wayUp(room, R.x - 4.4, R.z + 1.0);
      WORLD.addSolids([{ x: room.pool.x, z: room.pool.z, r: room.pool.r - 0.25 }]);
      room.task = { x: R.x + 0.6, z: R.z + 3.4 };
      room.echoAt = { x: R.x + 2.3, z: R.z + 3.0, yaw: Math.PI, pose: 'swim' };
    },
    // 2 · the Gear Room: the tower's gears on a big frame at the back, jammed by a stone between the two lowest
    room => {
      const R = room.R, g = room.g, k = Kit(), bz = R.z - 5.3;
      k.box(R.x, Y0 + 2.3, bz - 0.3, 6.6, 4.6, 0.3, '#4a3a33', { ink: 0.02 });
      for (const sx of [-1, 1]) k.box(R.x + sx * 3.2, Y0 + 2.3, bz - 0.1, 0.3, 4.6, 0.4, '#3b2e28', { ink: 0.015 });
      k.build(g);
      room.gears = [[-1.15, 1.25, 1.1, '#b98a4a', 12], [1.15, 1.25, 1.1, '#a87b3e', 12], [-2.3, 3.5, 0.7, '#c49a52', 9], [0, 3.7, 0.95, '#b98a4a', 11], [2.25, 3.35, 0.62, '#a87b3e', 8]]
        .map(([x, y, r, c, n]) => gear(g, R.x + x, Y0 + y, bz, r, c, n));
      room.stone = { x: R.x, z: bz + 0.55 };
      const st = grp(g, room.stone.x, Y0 + 0.5, room.stone.z), sk = Kit(); sk.add(KG.dodec, 0, 0, 0, 0.62, 0.55, 0.58, '#8a8494', { ink: 0.02 }).add(KG.dodec, 0.2, 0.25, 0.1, 0.25, 0.2, 0.22, '#9a94a6', { ink: 0.01 }); sk.build(st); room.stoneG = st;
      room.stoneSolid = { x: room.stone.x, z: room.stone.z, r: 0.75 }; WORLD.extra.push(room.stoneSolid);
      WORLD.addSolids([{ obox: 1, x: R.x, z: bz - 0.2, hw: 3.4, hd: 0.4, rot: 0 }]);
      wayUp(room, R.x + 4.2, R.z - 1.6);
      room.task = { x: R.x, z: R.z - 2.4 };
      room.echoAt = { x: R.x - 0.9, z: R.z - 3.6, yaw: Math.PI, pose: 'push' };
    },
    // 3 · the Dark Stairs: a stair up round the wall, dark crystals along it; the doorway at its top is dark too
    room => {
      const R = room.R, g = room.g, k = Kit(), n = 14, a0 = Math.PI * 0.42, a1 = Math.PI * 1.32;
      room.crystals = [];
      for (let i = 0; i < n; i++) {
        const a = lerp(a0, a1, i / (n - 1)), p = at(R, a, 5.75), h = 0.38 + i * 0.34;
        k.box(p.x, Y0 + h / 2, p.z, 1.15, h, 1.8, ['#6f6982', '#7b7590', '#655f78'][i % 3], { ry: a, ink: 0.012 });
        if (i % 2 === 1) { const c = at(R, a, 6.55); room.crystals.push(crystal(g, c.x, Y0 + h, c.z, 0.9 + (i % 4) * 0.1)); }
      }
      const top = at(R, a1 + 0.1, RR - 0.05);
      k.build(g);
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4), new THREE.MeshBasicMaterial({ color: '#06050a' })); door.position.set(top.x, Y0 + 5.1 + 1.0, top.z); door.lookAt(R.x, Y0 + 6, R.z); g.add(door);
      const dg = glow('#9ff8ff', 3.2, 0); dg.position.set(top.x, Y0 + 6.0, top.z); g.add(dg); room.doorGlow = dg;
      // (the stair's steps are solid: walk round them)
      for (let i = 0; i < n; i += 2) { const p = at(R, lerp(a0, a1, (i + 0.5) / (n - 1)), 5.75); WORLD.addSolids([{ x: p.x, z: p.z, r: 0.95 }]); }
      const foot = at(R, a0 - 0.32, 5.3);
      wayAt(room, foot.x, foot.z, 'Climb the stairs');
      room.task = { x: R.x + 1.4, z: R.z + 2.2 };
      room.echoAt = { x: R.x + 2.6, z: R.z + 0.6, yaw: Math.PI * 0.6, pose: 'sing' };
      room.dark = true;
    },
    // 4 · the Tree Room: a gray tree grown up through the tower's floor; its crown reaches the trapdoor
    room => {
      const R = room.R, g = room.g, k = Kit(), bx = R.x, bz = R.z - 1.2;
      const trunk = [[bx, Y0, bz, 0.62], [bx + 0.2, Y0 + 1.4, bz - 0.3, 0.5], [bx - 0.1, Y0 + 2.8, bz - 0.8, 0.42], [bx - 0.5, Y0 + 4.1, bz - 1.2, 0.33], [bx - 0.8, Y0 + 5.2, bz - 1.4, 0.24]];
      for (let i = 0; i < trunk.length - 1; i++) { const [x0, y0, z0, r0] = trunk[i], [x1, y1, z1] = trunk[i + 1]; k.rod(KG.cyl, [x0, y0, z0], [x1, y1, z1], r0, '#7d7786', 0.02); }
      const branches = [[1, 2.2, 0.2, 2.2, 3.4, 0.6], [2, 3.2, -0.9, 1.8, 4.2, -1.8], [2, -1.6, -0.7, 3.6, -1.2, -2.0], [3, 1.2, -1.2, 4.6, 1.8, -1.4], [3, -1.4, -0.6, 4.9, -2.0, 0.2], [1, -1.5, 0.4, 2.6, -2.2, 1.2]];
      room.tips = [];
      for (const [i0, x1, z1, y1, x2, z2] of branches) { const [x0, y0, z0] = trunk[i0]; k.rod(KG.cyl, [x0, y0 + 0.2, z0], [bx + x1, Y0 + y1, bz + z1], 0.14, '#7d7786', 0.012); k.rod(KG.cyl6, [bx + x1, Y0 + y1, bz + z1], [bx + x2 * 0.8, Y0 + y1 + 0.7, bz + z2], 0.08, '#857f8e', 0.01); room.tips.push(V(bx + x2 * 0.8, Y0 + y1 + 0.7, bz + z2)); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4; k.rod(KG.cyl6, [bx, Y0 + 0.3, bz], [bx + Math.sin(a) * 1.3, Y0 + 0.02, bz + Math.cos(a) * 1.3], 0.16, '#6f6978', 0.012); }
      for (let i = 0; i < 9; i++) { const a = i * 2.39, r = 1.6 + (i % 3) * 0.9; k.box(bx + Math.sin(a) * r, Y0 + 0.05, bz + Math.cos(a) * r, 0.5, 0.1, 0.4, '#5a4e46', { ry: a, ink: 0.006 }); }      // broken planks where it came up
      k.build(g);
      // the blossoms (after Mimo climbs it, the Hush lets go of the tree)
      const bl = grp(g, 0, 0, 0), blk = Kit();
      room.tips.forEach((p, i) => { for (let j = 0; j < 5; j++) blk.add(GEO.sphere, p.x + Math.sin(i * 3 + j * 1.3) * 0.32, p.y + Math.cos(j * 2.1) * 0.2, p.z + Math.cos(i * 2 + j) * 0.32, 0.22, 0.2, 0.22, j % 2 ? '#ffb7c9' : '#8fd17a', { ink: 0.008 }); });
      blk.build(bl, { shadow: false }); bl.visible = false; room.blossom = bl;
      WORLD.addSolids([{ x: bx, z: bz, r: 0.75 }]);
      wayUp(room, R.x - 2.4, R.z - 3.6);
      room.top = { x: bx - 0.8, y: Y0 + 5.0, z: bz - 1.4 };
      room.task = { x: R.x + 0.9, z: R.z + 1.8 };
      room.echoAt = { x: R.x + 1.4, z: R.z - 0.3, yaw: Math.PI * 1.1, pose: 'climb' };
    },
    // 5 · the Fog Room: the Hush's gray fog fills the room; the ladder is somewhere in it
    room => {
      const R = room.R, g = room.g;
      room.fog = []; const RN = rng(19);
      for (let i = 0; i < 30; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: i % 2 ? '#b9b5c8' : '#a6a2b8', transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
        const a = RN() * TAU, r = Math.sqrt(RN()) * 5.8, x = R.x + Math.sin(a) * r, z = R.z + Math.cos(a) * r, y = Y0 + 0.6 + RN() * 3.2;
        sp.position.set(x, y, z); sp.scale.setScalar(3.8 + RN() * 2.8); g.add(sp); room.fog.push({ sp, x0: x, y0: y, z0: z, ph: RN() * 6, k: 1 });
      }
      wayUp(room, R.x + 3.6, R.z - 3.4);
      room.task = { x: R.x, z: R.z + 2.6 };
      room.echoAt = { x: R.x - 1.6, z: R.z + 1.2, yaw: Math.PI * 0.9, pose: 'blow' };
    },
    // 6 · the Bird Loft: perches and nests, gray birds asleep on them, the trapdoor's pull-rope out of reach
    room => {
      const R = room.R, g = room.g, k = Kit();
      const perches = [[Math.PI * 0.62, Math.PI * 0.86, 2.6], [Math.PI * 0.95, Math.PI * 1.2, 3.3], [Math.PI * 1.25, Math.PI * 1.42, 2.4]];
      room.birds = []; const cols = ['#4c7fd8', '#e2574c', '#f2c94c', '#5fb257', '#e98ac2', '#8a6bd8', '#f08a3c'];
      perches.forEach(([a0, a1, h], pi) => {
        const p0 = at(R, a0, RR - 0.6), p1 = at(R, a1, RR - 0.6);
        k.rod(KG.cyl6, [p0.x, Y0 + h, p0.z], [p1.x, Y0 + h, p1.z], 0.07, '#6b4a30', 0.01);
        for (const p of [p0, p1]) k.box(p.x, Y0 + h - 0.1, p.z, 0.2, 0.2, 0.2, '#4a3a33', { ink: 0.008 });
        const nb = pi === 1 ? 3 : 2;
        for (let j = 0; j < nb; j++) { const u = (j + 0.5) / nb, x = lerp(p0.x, p1.x, u), z = lerp(p0.z, p1.z, u); const b = bird(g, x, Y0 + h + 0.04, z, cols[room.birds.length % cols.length]); b.g.lookAt(R.x, Y0 + h, R.z); room.birds.push(b); }
      });
      for (const [a, h] of [[Math.PI * 0.75, 4.4], [Math.PI * 1.1, 4.6]]) { const p = at(R, a, RR - 0.7); k.box(p.x, Y0 + h - 0.12, p.z, 0.9, 0.1, 0.7, '#5a4030', { ry: a, ink: 0.01 }); k.add(new THREE.TorusGeometry(1, 0.35, 6, 14), p.x, Y0 + h, p.z, 0.32, 0.32, 0.32, '#8a6a40', { rx: Math.PI / 2, ink: 0.008 }); }
      k.build(g);
      wayUp(room, R.x + 2.4, R.z - 3.0);
      const pr = grp(g, R.x + 2.4, Y0 + 5.42, R.z - 2.3); pr.add(part(KG.cyl6, '#b5986a', [0, -0.8, 0], [0.04, 1.6, 0.04], { ink: 0.006 })); pr.add(part(new THREE.TorusGeometry(1, 0.25, 6, 14), '#c9a24a', [0, -1.65, 0], [0.16, 0.16, 0.16], { ink: 0.006 }));
      room.pull = pr;
      room.task = { x: R.x, z: R.z + 2.4 };
      room.echoAt = { x: R.x + 1.0, z: R.z - 0.6, yaw: Math.PI * 0.95, pose: 'call' };
    },
    // 7 · the Hourglass Room: the great hourglass broke; its sand buried the little door up to the next floor
    room => {
      const R = room.R, g = room.g, k = Kit(), hx = R.x - 3.2, hz = R.z - 4.0;
      for (const y of [0.15, 4.25]) k.add(KG.cyl, hx, Y0 + y, hz, 1.25, 0.3, 1.25, '#6b4a30', { ink: 0.02 });
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; k.add(KG.cyl6, hx + Math.sin(a) * 1.05, Y0 + 2.2, hz + Math.cos(a) * 1.05, 0.09, 4.0, 0.09, '#5a3a24', { ink: 0.01 }); }
      for (let i = 0; i < 7; i++) { const a = i * 1.7, r = 0.6 + (i % 3) * 0.3; k.add(KG.dodec, hx + 1.2 + Math.sin(a) * r, Y0 + 0.1, hz + 1.0 + Math.cos(a) * r, 0.16, 0.05, 0.12, '#cfe7f2', { ry: a, ink: 0.006 }); }   // glass on the floor
      const D = at(R, 2.3, RR - 0.08), dyaw = Math.atan2(R.x - D.x, R.z - D.z);
      room.door = { x: D.x, z: D.z, yaw: dyaw };
      k.box(D.x, Y0 + 1.3, D.z, 1.8, 2.7, 0.2, '#4a3a33', { ry: dyaw, ink: 0.02 });
      k.build(g);
      const glassM = new THREE.MeshToonMaterial({ color: '#d7eef7', gradientMap: TK.grad, transparent: true, opacity: 0.45 });
      [[2.95, 1.0], [1.45, 0.82]].forEach(([y, s]) => { const m = new THREE.Mesh(GEO.sphere, glassM); m.scale.set(s, 1.05, s); m.position.set(hx, Y0 + y, hz); g.add(m); });
      const sandM = new THREE.MeshToonMaterial({ color: '#e2c48a', gradientMap: TK.grad });
      const pile = new THREE.Mesh(GEO.sphere, sandM); pile.scale.set(0.7, 0.36, 0.7); pile.position.set(hx, Y0 + 1.0, hz); g.add(pile);
      room.dunes = [];
      const RN = rng(5); for (let i = 0; i < 9; i++) { const a = RN() * TAU, r = 1.5 + RN() * 3.8, m = new THREE.Mesh(GEO.sphere, sandM); m.scale.set(1.1 + RN(), 0.22 + RN() * 0.18, 1.0 + RN()); m.position.set(R.x + Math.sin(a) * r, Y0, R.z + Math.cos(a) * r); g.add(m); }
      // the little door, and the big dune over it
      const dp = grp(g, D.x, Y0, D.z); dp.rotation.y = dyaw;
      const leaf = grp(dp, -0.6, 0, 0.14); leaf.add(part(GEO.box, '#7a5a40', [0.6, 1.15, 0], [1.2, 2.3, 0.1], { ink: 0.012 })); leaf.add(part(GEO.box, '#c9a24a', [1.05, 1.1, 0.07], [0.12, 0.12, 0.06], { ink: 0.004 }));
      room.leaf = leaf;
      const dark = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.3), mats().hole); dark.position.set(0, 1.15, 0.1); dp.add(dark);
      const dune = new THREE.Mesh(GEO.sphere, sandM); const toward = { x: D.x + Math.sin(dyaw) * 0.9, z: D.z + Math.cos(dyaw) * 0.9 };
      dune.scale.set(2.1, 1.65, 1.6); dune.position.set(toward.x, Y0 - 0.1, toward.z); dune.rotation.y = dyaw; g.add(dune); room.dune = dune;
      room.duneSolid = { x: toward.x, z: toward.z, r: 1.5 }; WORLD.extra.push(room.duneSolid);
      WORLD.addSolids([{ x: hx, z: hz, r: 1.4 }]);
      wayAt(room, D.x + Math.sin(dyaw) * 1.6, D.z + Math.cos(dyaw) * 1.6, 'Go through the door', 2.6);
      room.task = { x: D.x + Math.sin(dyaw) * 3.4, z: D.z + Math.cos(dyaw) * 3.4 };
      room.echoAt = { x: D.x + Math.sin(dyaw) * 2.6 - 1.0, z: D.z + Math.cos(dyaw) * 2.6 + 0.4, yaw: dyaw + Math.PI, pose: 'dig' };
    },
    // 8 · the Hall of Shadows: shadows slide over the walls and hide the last door
    room => {
      const R = room.R, g = room.g;
      const D = at(R, Math.PI, RR - 0.08); room.door = { x: D.x, z: D.z };
      const dm = new THREE.MeshToonMaterial({ color: '#15121c', gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
      const dp = grp(g, D.x, Y0, D.z + 0.1);
      const arch = new THREE.Shape(); arch.moveTo(-1.1, 0); arch.lineTo(1.1, 0); arch.lineTo(1.1, 2.3); arch.absarc(0, 2.3, 1.1, 0, Math.PI, false); arch.lineTo(-1.1, 0);
      const slab = new THREE.Mesh(new THREE.ShapeGeometry(arch), dm); dp.add(slab); room.doorMat = dm;
      const emb = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), dm); emb.position.set(0, 2.55, 0.02); dp.add(emb);
      room.doorGlow = glow('#ffe39a', 4.5, 0); room.doorGlow.position.set(D.x, Y0 + 2.0, D.z + 0.6); g.add(room.doorGlow);
      room.shadows = []; const RN = rng(23);
      for (let i = 0; i < 10; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: shadowTex(), transparent: true, opacity: 0.95, depthWrite: false, fog: false }));
        const a = Math.PI * (0.45 + RN() * 1.1), p = at(R, a, RR - 0.7 - RN() * 0.6);
        sp.position.set(p.x, Y0 + 0.9 + RN() * 2.4, p.z); sp.scale.setScalar(1.5 + RN() * 1.2); g.add(sp);
        room.shadows.push({ sp, a, r: RR - 0.8, y: sp.position.y, ph: RN() * 6, sp0: 0.08 + RN() * 0.1, k: 1 });
      }
      const cover = new THREE.Sprite(new THREE.SpriteMaterial({ map: shadowTex(), transparent: true, opacity: 1, depthWrite: false, fog: false })); cover.position.set(D.x, Y0 + 1.9, D.z + 0.5); cover.scale.setScalar(3.6); g.add(cover); room.cover = cover;
      wayAt(room, D.x, D.z + 1.4, 'Go up to the top', 3.0);
      room.task = { x: R.x, z: R.z - 0.6 };
      room.echoAt = { x: R.x + 1.4, z: R.z - 2.4, yaw: Math.PI, pose: 'scared' };
      room.dark = true;
    },
  ];
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene;
    ROOMS.forEach((R, i) => {
      const g = new THREE.Group(); g.visible = false; g.name = 'oldtower-' + R.id; scene.add(g);
      const room = Object.assign({ R, g, i }, shell(R, g));
      rooms[i] = room;
      try {
        if (i < 8) BUILD[i](room);
        else if (typeof OLDBOSS !== 'undefined' && OLDBOSS.buildTop) OLDBOSS.buildTop(room, { Kit, KG, mats, glow, grp, at, Y0, RR, WH, wayAt });
      } catch (e) { console.error('[oldtower] floor ' + (i + 1), e); }
      room.E = echoFigure(g);
    });
    applyState();
  }
  // each room as the saved progress says
  function applyState() {
    const st = S(), done = st.done || {};
    rooms.forEach((room, i) => {
      if (!done[i] || i > 7) return;
      markLit(room, true);
      if (room.way) openWay(room, true);
      if (i === 0 && room.ropeG) room.ropeG.position.y = -0.6;
      if (i === 1) { if (room.stoneG) { room.stoneG.position.set(room.R.x + 2.4, Y0 + 0.5, room.R.z - 3.4); } unsolid(room.stoneSolid); }
      if (i === 2) room.crystals.forEach(c => { c.want = c.lit = 1; });
      if (i === 3 && room.blossom) { room.blossom.visible = true; }
      if (i === 4) room.fog.forEach(f => { f.k = 0; f.sp.visible = false; });
      if (i === 5) room.birds.forEach(b => { b.wake = 1; });
      if (i === 6) { if (room.dune) room.dune.visible = false; unsolid(room.duneSolid); if (room.leaf) room.leaf.rotation.y = -1.6; }
      if (i === 7) { room.shadows.forEach(s => { s.k = 0; s.sp.visible = false; }); room.cover.visible = false; room.doorMat.color.set('#c9a24a'); room.doorMat.emissive.setRGB(0.3, 0.2, 0.05); }
    });
  }
  function markLit(room, on) {
    if (!room || !room.markMat) return;
    room.markMat.color.set(on ? '#e9b949' : '#7d7790'); room.markMat.emissive.setRGB(on ? 0.45 : 0, on ? 0.3 : 0, on ? 0.05 : 0);
    room.markGlow.material.opacity = on ? 0.55 : 0;
  }

  // ------------------------------------------------------------ telling Mimo: the floor's verb, in a whole sentence
  const TITLES = [
    'The rope that opens the trapdoor hangs on the far side of the water.',
    'A stone is stuck between the two big gears, and nothing turns.',
    'Dark crystals line the stair, and it’s too dark to climb.',
    'The trapdoor is high up, over the gray tree’s crown.',
    'A thick gray fog fills the room. The ladder is in there somewhere.',
    'The trapdoor’s rope hangs up high, out of reach. Gray birds sleep on the perches.',
    'The little door to the next floor is buried under a dune of sand.',
    'Shadows slide over the walls. Somewhere behind them there’s a door.',
  ];
  const HINTS = ['{mimo} looks at the rope across the water. What did Noa say?', '{mimo} looks at the stone in the gears.', '{mimo} looks at the dark crystals on the stair.',
    '{mimo} looks up the gray tree.', '{mimo} squints into the fog.', '{mimo} looks at the sleeping birds.', '{mimo} sniffs the big dune of sand.', '{mimo} hides behind you, looking at the shadows.'];
  // the verbs of the three newest regions, if their own files haven't registered them yet (only when a floor needs one)
  function ensureVerb(id) { if (!has(id) && OTXT.VERB_FALLBACK[id]) LEX.register([OTXT.VERB_FALLBACK[id]]); }
  // does the typed text say one of these (es / pt / de: whole words, accents optional; zh / ja: CJK.contains)?
  function saysAny(text, forms, l) {
    if (!forms || !forms.length) return false;
    if (l === 'zh' || l === 'ja') return typeof CJK !== 'undefined' && forms.some(f => CJK.contains(text, f, l));
    const w = ' ' + nrm(text).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ') + ' ';
    return forms.some(f => w.includes(' ' + nrm(f) + ' '));
  }
  // the frame's own little words, the ones that aren't the verb or the blank: «hasta la», «zum», «まで», «[到|dào] [那里|nà lǐ]»
  function smallWords(F, l) {
    const fr = F.frame[l] || '', cj = l === 'zh' || l === 'ja', more = (F.more || {})[l] || [];
    const toks = cj ? (fr.match(/\[[^\]]*\]|\S+/g) || []) : fr.split(/[\s¡!¿?.,«»]+/);      // (zh / ja: a [字|reading] token is one, spaces and all)
    const isVerb = t => (cj ? t === (has(F.verb) ? LEX.src(F.verb) : '') || more.includes(t) || (has(F.verb) && LEX.heard(F.verb, CJK.plain ? CJK.plain(t, { lang: l }) : t))
      : (has(F.verb) && LEX.heard(F.verb, t)) || saysAny(t, more, l));
    return toks.filter(t => t && t !== '___' && !/^[¡!¿?。！，、…]+$/.test(t) && !isVerb(t));
  }
  // the verb, the thing, and a letter: S (the whole sentence, first try), A (a little word or an accent missing), and one
  // letter lower for each miss before it (the model sentence shows after two), down to C
  function gradeOf(i, r) {
    const F = OTXT.FLOORS[i], l = lang(), text = r.text || '';
    const verb = r.verb === F.verb || saysAny(text, (F.more || {})[l], l) || (has(F.verb) && LEX.heard(F.verb, text));
    const thing = (has(F.thing) && LEX.heard(F.thing, text)) || saysAny(text, F.forms[l], l);
    let letter = null, why = '';
    if (verb && thing) {
      const chip = String(F.chip[l] || '').toLowerCase(), accented = !isC() && chip !== nrm(chip);
      // (P6a, accents.js: the verb without its accent costs nothing, a tip shows it, unless what you typed is another form as typed)
      const ac = accented && typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, chip, l) : { found: false, keep: false, tip: '' };
      const accentOk = !accented || text.toLowerCase().includes(chip) || (typeof ACCENTS !== 'undefined' && !ac.keep);
      let missing = [];
      try { missing = smallWords(F, l).filter(w => !saysAny(text, [w], l)); } catch (e) { missing = []; }
      const misses = Math.min(2, Math.max(r.peeked ? 2 : 0, ((S().miss || {})[i]) || 0));      // ("I don't know" showed the sentence: like two misses)
      letter = 'SABC'[Math.min(3, (accentOk && !missing.length ? 0 : 1) + misses)];
      why = missing.length ? `Almost! Noa said: «${OTXT.pick(F.model, l)}»` : !accentOk ? (ac.why || `Accent: «${F.chip[l]}»`) : r.peeked ? 'Whole sentence (with help)' : misses ? 'Whole sentence (on another try)' : 'Whole sentence';
      if (accentOk && ac.found && ac.tip && !missing.length) why += ' · ' + ac.tip;
    }
    return { verb, thing, letter, why, other: r.verb && r.verb !== F.verb ? r.verb : null };
  }
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  const iconOf = F => (typeof ICONS !== 'undefined' && ICONS.keys.includes(F.icon) ? F.icon : typeof ICONS !== 'undefined' && ICONS.keys.includes(F.verb.slice(2)) ? F.verb.slice(2) : 'star');
  async function task(i) {
    const F = OTXT.FLOORS[i], l = lang(), name = G.state.mimoName, st = S();
    ensureVerb(F.verb);
    if (has(F.thing)) STORY.introduce(F.thing);
    // (rōmaji / pinyin: a frame that opens on the blank, and the chip, aren't the start of a sentence: «___ made oyoide!», «rōpu»)
    const frame = OTXT.pick(F.frame, l).replace(/^(___\s*)(\p{Lu})/u, (m, a, b) => a + (isC() ? b.toLowerCase() : b));
    const chip0 = OTXT.pick(F.chip, l), chip = isC() ? chip0.replace(/^\p{Lu}/u, c => c.toLowerCase()) : chip0, model = OTXT.pick(F.model, l);
    const r = await UI.command({ name, icon: iconOf(F), title: `${TITLES[i]} Tell ${name} the whole sentence, the way Noa said it.`, verbs: verbs(), answer: F.verb,
      model: OTXT.pick(F.model, l, true), modelEn: F.model.en, placeholder: `«${frame}»`,
      hint: `«${frame}» · ___ = ${chip} (${F.chip.en}). Stuck? ? shows the whole sentence.` });
    if (!r || r.cancelled) return;
    { const h = document.getElementById('command-hint'); r.peeked = !!(h && /^Try/.test(h.textContent || '')); }     // (ui.js's "I don't know" left the model in the hint)
    const g = gradeOf(i, r), miss = () => { st.miss = st.miss || {}; return (st.miss[i] = (st.miss[i] || 0) + 1); };
    if (!g.verb) {
      if (g.other) { await wrong(i, g.other); if (miss() >= 2) STORY.think(`Noa said it like this: «${model}»`, 5.5); return; }
      G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; snd('wrong');
      STORY.think(miss() >= 2 ? `{mimo} tilts its head. Like Noa: «${model}»` : `{mimo} tilts its head. Which action? «${frame}»`, 5);
      return;
    }
    if (!g.thing) {
      if (has(F.verb)) LEX.attempt(F.verb, { ok: true, hints: 0, ms: r.ms || 3000, mode: 'command' });
      G.sim.mimo.tiltT = 1.6; G.sim.mimoSay(ex(LEX.form(F.verb)) + ' …?', 1.8); snd('chirp');
      STORY.think(miss() >= 2 ? `{mimo} is ready… but where? The whole sentence: «${model}»` : `{mimo} is ready… but where? Say the whole sentence: «${frame}» (___ = ${chip})`, 5.5);
      return;
    }
    learnUse(F.verb, r.ms);
    if (has(F.thing)) LEX.attempt(F.thing, { ok: true, hints: 0, ms: r.ms || 3000, mode: 'command' });
    UI.toast(`${g.letter} · ${g.why}`); snd(g.letter === 'S' ? 'chest' : 'review');
    st.grades = st.grades || {}; st.grades[i] = g.letter;
    await ACT[i]();
  }
  // a verb that isn't this floor's: its own harmless little scene, and nothing changes
  async function wrong(i, verb) {
    const room = rooms[i], t0 = room.task, Mm = G.sim.mimo;
    G.sim.mimoGo({ x: t0.x + 0.8, z: t0.z - 1.3 }, null); await wait(0.6);
    const say = s => STORY.think(s, 3.8);
    const W = {
      'v.jump': () => { Mm.hop = { t: 0 }; snd('jump'); say('{mimo} hops up and down. Nothing happens.'); },
      'v.hit': () => { snd('hit'); Mm.sad = 1.2; say('{mimo} bonks the floor. Ouch!'); },
      'v.throw': () => { snd('whiff'); say('{mimo} throws a pebble. Plink. Nothing.'); },
      'v.push': () => { snd('land', 6); say('{mimo} pushes and pushes… there’s nothing here to push.'); },
      'v.swim': () => say('{mimo} looks around for water to swim in.'),
      'v.sing': () => { snd('sing'); say('{mimo} sings. Pretty… but nothing changes.'); },
      'v.climb': () => say('{mimo} looks around for something to climb.'),
      'v.blow': () => { snd('blow'); say('{mimo} blows and blows. Nothing moves.'); },
      'v.call': () => { snd('whistle'); say('{mimo} calls out. Only an echo answers.'); },
      'v.dig': () => { snd('scratch'); say('{mimo} scratches at the floorboards. Nothing under there.'); },
      'v.light': () => { Mm.glow = 1; say('{mimo}’s gem glows… but there’s nothing dark to light here.'); },
      'v.eat': () => say('{mimo} sniffs around for a snack. Not now!'),
    };
    (W[verb] || (() => say('{mimo} tries… but nothing happens.')))();
    G.sim.mimoGo(null, null);
  }
  // a floor's verb worked: the bell mark lights (the recap of that region's verb), and the save
  async function solved(i) {
    const st = S(); st.done = st.done || {}; st.done[i] = true;
    const room = rooms[i], F = OTXT.FLOORS[i], rc = RECAP[i];
    markLit(room, true); snd('bell');
    G.w3d.fx.sparkle(room.markAt.x, Y0 + 3.4, room.markAt.z - 1.25, 16, ['#ffd166', '#fff3a0']);
    UI.toast(`🔔 ${poss(Cap(rc.region))} bell answers: «${LEX.form(F.verb)}»${rc.who ? ` · ${rc.who} taught it` : ''}`);
    G.save();
  }
  // the bell mark's plaque: the region, its verb, who taught it (their own words), and Noa's sentence here
  async function readMark(i) {
    const F = OTXT.FLOORS[i], rc = RECAP[i], l = lang(), lines = [];
    ensureVerb(F.verb);
    lines.push({ text: LEX.form(F.verb), en: `${(LEX.item(F.verb) || {}).en || ''} · ${poss(rc.region)} verb` });
    if (lineOf(rc.key) && lineText(rc.key, l)) lines.push({ text: lineText(rc.key, l), en: `${rc.who}: ${lineText(rc.key, 'en').replace(/\{[^}]*\}/g, '')}` });
    lines.push({ text: OTXT.pick(F.model, l), en: F.model.en });
    if (typeof SIGNS !== 'undefined' && SIGNS.read) await SIGNS.read({ tag: `${poss(Cap(rc.region))} bell${(S().done || {})[i] ? ' (it rang for you)' : ''}`, lines });
    else STORY.think(lines.map(x => x.text).join(' · '), 5);
  }

  // ------------------------------------------------------------ the actions (Mimo does it; the way up opens)
  const MM = () => G.sim.mimo, MR = () => G.cast.mimo.root;
  async function arcTo(to, dur = 0.6, h = 1.0) { const r = MR(), p0 = r.position.clone(); MM().hidden = true; await tween(dur, k => { r.position.lerpVectors(p0, to, k); r.position.y += Math.sin(k * Math.PI) * h; }); snd('pip'); }
  function land(x, z) { const Mm = MM(); Mm.x = x; Mm.z = z; Mm.y = Mm.ry = Y0; Mm.hidden = false; Mm.land = 0; MR().rotation.set(0, 0, 0); snd('land', 4); }
  const shot = (pos, look) => { G.cam.override = { pos, look, dur: 0.8 }; };
  const endAct = () => { G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); };
  const ACT = [
    async function swimRope() {
      const room = rooms[0], R = room.R, P = room.pool, r = MR();
      G.sim.lock = 1; shot(V(R.x + 3.5, Y0 + 4.4, R.z + 9.0), V(P.x, Y0 + 0.8, P.z - 1.8));
      G.sim.mimoGo({ x: P.x, z: P.z + P.r + 0.45 }, room.rope); await wait(0.8);
      MM().hidden = true; snd('jump');
      const p0 = r.position.clone(), wy = Y0 + 0.02, x1 = room.rope.x, z1 = room.rope.z + 0.5;
      await tween(1.6, k => { r.position.set(lerp(p0.x, x1, k), wy - 0.12 + Math.sin(k * 26) * 0.04, lerp(p0.z, z1, k)); r.rotation.set(0.35, Math.atan2(x1 - p0.x, z1 - p0.z), 0); if (Math.random() < 0.25) G.w3d.fx.puff(r.position.x, wy + 0.05, r.position.z, 2, 0.12, '#cfe6f0'); });
      snd('pip');
      await tween(0.9, k => { room.ropeG.position.y = -0.6 * k; r.position.y = wy - 0.12 - 0.18 * Math.sin(k * Math.PI); });
      await openWay(room);
      await tween(1.3, k => { r.position.set(lerp(x1, p0.x, k), wy - 0.12 + Math.sin(k * 26) * 0.04, lerp(z1, p0.z, k)); r.rotation.set(0.35, Math.atan2(p0.x - x1, p0.z - z1), 0); });
      land(p0.x, p0.z); G.w3d.fx.puff(p0.x, Y0 + 0.1, p0.z, 6, 0.2, '#cfe6f0');
      endAct(); await solved(0);
    },
    async function pushStone() {
      const room = rooms[1], R = room.R, s = room.stone, Mm = MM();
      G.sim.lock = 1; shot(V(R.x - 2.6, Y0 + 3.4, R.z + 4.4), V(R.x, Y0 + 1.4, R.z - 5.0));
      G.sim.mimoGo({ x: s.x - 0.3, z: s.z + 1.15 }, s); await wait(0.9);
      for (let k = 0; k < 3; k++) { snd('land', 7 + k * 2); Mm.hop = { t: 0 }; room.stoneG.rotation.z = (k % 2 ? 1 : -1) * 0.14; await wait(0.3); }
      snd('crunch');
      const x0 = room.stoneG.position.x, z0 = room.stoneG.position.z, x1 = R.x + 2.4, z1 = R.z - 3.4;
      await tween(1.0, k => { room.stoneG.position.set(lerp(x0, x1, k), Y0 + 0.5 + Math.sin(k * Math.PI) * 0.3, lerp(z0, z1, k)); room.stoneG.rotation.x -= 0.12; });
      snd('land', 9); G.w3d.fx.puff(x1, Y0 + 0.1, z1, 10, 0.3, '#a9a3b5'); unsolid(room.stoneSolid);
      room.turning = true; snd('gears'); snd('clockset');
      await wait(0.6); await openWay(room);
      endAct(); await solved(1);
    },
    async function singStairs() {
      const room = rooms[2], R = room.R, Mm = MM();
      G.sim.lock = 1; shot(V(R.x - 4.2, Y0 + 4.2, R.z + 7.6), V(R.x + 2.6, Y0 + 2.3, R.z - 2.0));
      G.sim.mimoGo({ x: R.x + 1.8, z: R.z + 1.0 }, { x: R.x + 5, z: R.z - 2 }); await wait(0.8);
      snd('sing'); Mm.happy = 2.5;
      for (let k = 0; k < 5; k++) { G.w3d.fx.sparkle(Mm.x, Y0 + 1.1, Mm.z, 4, ['#7ff7ea', '#fff3a0']); await wait(0.16); }
      for (const c of room.crystals) { c.want = 1; snd('chime'); G.w3d.fx.sparkle(c.g.position.x, c.g.position.y + 0.5, c.g.position.z, 8, ['#8ff8ff', '#ffffff']); await wait(0.32); }
      lightT = 1; await wait(0.6);
      await openWay(room);
      endAct(); await solved(2);
    },
    async function climbTree() {
      const room = rooms[3], R = room.R, r = MR(), T = room.top, w = room.way;
      G.sim.lock = 1; shot(V(R.x + 4.6, Y0 + 4.6, R.z + 7.0), V(R.x - 0.8, Y0 + 3.2, R.z - 2.0));
      G.sim.mimoGo({ x: R.x + 0.7, z: R.z - 0.3 }, { x: R.x, z: R.z - 1.2 }); await wait(0.8);
      MM().hidden = true; snd('climb');
      const path = [V(R.x + 0.5, Y0 + 0.3, R.z - 0.75), V(R.x + 0.6, Y0 + 1.6, R.z - 1.05), V(R.x + 0.35, Y0 + 3.0, R.z - 1.6), V(R.x - 0.15, Y0 + 4.3, R.z - 2.0), V(T.x, T.y, T.z)];
      let from = r.position.clone();
      for (const q of path) { const a = from.clone(); await tween(0.42, k => { r.position.lerpVectors(a, q, k); r.position.x += Math.sin(k * Math.PI * 2) * 0.05; }); snd('climb'); from = q; }
      await arcTo(V(w.x, Y0 + 4.9, w.z + 0.55), 0.55, 0.6);
      await openWay(room);
      room.blossom.visible = true; room.blossom.scale.setScalar(0.01); snd('learned');
      tween(1.2, k => room.blossom.scale.setScalar(Math.max(0.01, k)));
      const f = w.foot, a0 = r.position.clone();
      await tween(0.9, k => { r.position.set(lerp(a0.x, f.x, k), lerp(a0.y, Y0, k), lerp(a0.z, f.z + 0.4, k)); });
      land(f.x, f.z + 0.4);
      endAct(); await solved(3);
    },
    async function blowFog() {
      const room = rooms[4], R = room.R;
      G.sim.lock = 1;
      G.sim.mimoGo({ x: R.x, z: R.z + 1.6 }, { x: R.x, z: R.z - 3 }); await wait(0.6);
      const pb = typeof PEAKS !== 'undefined' && PEAKS.mimoBlow ? PEAKS.mimoBlow({ x: R.x, z: R.z - 3 }, 1.4) : (snd('blow'), wait(1.4));
      await tween(1.6, u => room.fog.forEach((f, i) => { f.k = 1 - u; f.sp.position.x = f.x0 + u * ((i % 5) - 2) * 2.4; f.sp.position.z = f.z0 - u * 5; f.sp.position.y = f.y0 + u * 1.5; f.sp.material.opacity = 0.9 * (1 - u); }));
      await pb;
      room.fog.forEach(f => { f.sp.visible = false; });
      await openWay(room);
      endAct(); await solved(4);
    },
    async function callBirds() {
      const room = rooms[5], R = room.R, Mm = MM(), pull = room.pull;
      G.sim.lock = 1; shot(V(R.x - 1.6, Y0 + 3.4, R.z + 7.4), V(R.x + 1.0, Y0 + 3.4, R.z - 3.0));
      G.sim.mimoGo({ x: R.x + 0.6, z: R.z + 1.0 }, { x: R.x + 2.4, z: R.z - 2.3 }); await wait(0.8);
      snd('whistle'); Mm.happy = 2;
      await wait(0.5);
      for (const b of room.birds) { b.wakeT = 1; snd('chirp'); await wait(0.18); }
      await wait(0.4);
      const ringAt = V(R.x + 2.4, Y0 + 3.85, R.z - 2.3);
      room.birds.forEach((b, i) => { b.fly = 1; b.from = b.g.position.clone(); b.to = ringAt.clone().add(V(Math.sin(i * 0.9) * 0.45, 0.25 + (i % 3) * 0.12, Math.cos(i * 0.9) * 0.45)); });
      await tween(1.1, k => room.birds.forEach(b => { b.g.position.lerpVectors(b.from, b.to, k); b.g.position.y += Math.sin(k * Math.PI) * 0.9; }));
      snd('wood');
      await tween(0.8, k => { pull.position.y = Y0 + 5.42 - 1.4 * k; room.birds.forEach(b => { b.g.position.y = b.to.y - 1.4 * k; }); });
      await openWay(room);
      room.birds.forEach(b => { b.from = b.g.position.clone(); });
      await tween(1.2, k => room.birds.forEach(b => { b.g.position.lerpVectors(b.from, b.home, k); b.g.position.y += Math.sin(k * Math.PI) * 0.8; }));
      room.birds.forEach(b => { b.fly = 0; }); pull.position.y = Y0 + 5.42;
      endAct(); await solved(5);
    },
    async function digSand() {
      const room = rooms[6], D = room.door, Mm = MM(), dy = D.yaw;
      G.sim.lock = 1;
      const front = { x: D.x + Math.sin(dy) * 2.7, z: D.z + Math.cos(dy) * 2.7 };
      shot(V(front.x + Math.sin(dy) * 6 - 2.2, Y0 + 3.8, front.z + Math.cos(dy) * 6 + 2.2), V(D.x, Y0 + 1.0, D.z));
      G.sim.mimoGo(front, D); await wait(0.9);
      for (let k = 0; k < 6; k++) { Mm.hop = { t: 0 }; snd('scratch'); G.w3d.fx.puff(D.x + Math.sin(dy) * 1.5 + (Math.random() - 0.5), Y0 + 0.6, D.z + Math.cos(dy) * 1.5 + (Math.random() - 0.5), 8, 0.28, '#e2c48a'); room.dune.scale.y *= 0.8; room.dune.scale.x *= 0.93; await wait(0.3); }
      await tween(0.4, k => { room.dune.scale.y = Math.max(0.04, room.dune.scale.y * (1 - k * 0.4)); });
      room.dune.visible = false; unsolid(room.duneSolid);
      snd('wood'); await tween(0.8, k => { room.leaf.rotation.y = -1.6 * k; });
      await openWay(room);
      endAct(); await solved(6);
    },
    async function lightDoor() {
      const room = rooms[7], R = room.R, D = room.door, Mm = MM();
      G.sim.lock = 1; shot(V(R.x + 2.6, Y0 + 3.6, R.z + 6.4), V(D.x, Y0 + 2.0, D.z));
      G.sim.mimoGo({ x: R.x, z: R.z - 2.6 }, D); await wait(0.8);
      Mm.glow = 1; snd('learned');
      const burst = glow('#fff1b8', 1, 0.95); burst.position.set(Mm.x, Y0 + 0.9, Mm.z); room.g.add(burst);
      await tween(1.2, k => { burst.scale.setScalar(1 + k * 16); burst.material.opacity = 0.95 * (1 - k * 0.6); lightT = 0.2 + k; room.shadows.forEach(s => { s.k = 1 - k; s.sp.material.opacity = 0.95 * (1 - k); }); room.cover.material.opacity = 1 - k; });
      room.g.remove(burst);
      room.shadows.forEach(s => { s.sp.visible = false; }); room.cover.visible = false;
      const c0 = new THREE.Color('#15121c'), c1 = new THREE.Color('#c9a24a');
      await tween(0.8, k => { room.doorMat.color.copy(c0).lerp(c1, k); room.doorMat.emissive.setRGB(0.3 * k, 0.2 * k, 0.05 * k); room.doorGlow.material.opacity = 0.7 * k; });
      snd('clockset');
      await openWay(room);
      endAct(); await solved(7);
    },
  ];

  // ------------------------------------------------------------ Noa's echoes (on your first visit to each floor)
  // The floor's sentence is a demonstration (STORY.demoAt: the language, the floor's thing glossed); her other words go
  // through the weave like anyone's (STORY.sayAt)
  const ECHO = [[['ot.noa.in', 0], ['ot.noa.1', 1]], [['ot.noa.2', 1]], [['ot.noa.3', 1]], [['ot.noa.4', 1], ['ot.noa.steps', 0]], [['ot.noa.5', 1]],
    [['ot.noa.6', 1], ['ot.noa.book', 0]], [['ot.noa.7', 1]], [['ot.noa.8', 1], ['ot.noa.who', 0]]];
  async function echoScene(i) {
    const room = rooms[i], E = room.E, A = room.echoAt; if (!E || !A) return;
    const sim = G.sim, p = { x: A.x, y: Y0, z: A.z, top: 1.55, name: 'Noa' };
    sim.lock = 1;
    G.cam.override = { pos: V(A.x + 3.4, Y0 + 2.7, A.z + 6.2), look: V(A.x, Y0 + 1.2, A.z - 0.6), dur: 0.9 };
    await echoIn(E, A.x, A.z, A.yaw, A.pose);
    if (i === 0) sim.mimo.scared = 2;
    const F = OTXT.FLOORS[i];
    if (F && has(F.thing)) STORY.introduce(F.thing);
    for (const [key, demo] of ECHO[i]) {
      if (key === 'ot.noa.who') E.pose = 'scared';
      await (demo ? STORY.demoAt(p, key, 'Noa') : STORY.sayAt(p, key, 'Noa'));
    }
    if (i === 7) { snd('tick'); await wait(0.35); snd('tick'); }     // (her last echo stops on a clock's tick)
    await echoOut(E);
    G.cam.override = null;
    if (i === 0) await STORY.you('That’s Noa’s voice! …An echo. The {w.tower} kept her words.');
    if (i === 7) await STORY.you('Noa… We’re almost there. Hold on!');
    sim.lock = 0;
  }
  // mixed foes from every region (the ones this language's battle knows)
  function ambushFoes(i) {
    const B = typeof BATTLE !== 'undefined' ? BATTLE._ : null, L = B && B.LANGS && B.LANGS[lang()], M = B && B.M;
    const ok = k => !!(L && L.species && L.species[k]) && (!M || !M.kindOf || M.kindOf(k) === k);
    return (AMBUSH[i] || []).filter(([k]) => ok(k)).slice(0, 3).map(([kind, color]) => ({ kind, color, size: 'small' }));
  }

  // ------------------------------------------------------------ moving: in and out, up and down
  const FOG = ['#191722', '#1d1a24', '#0b0a12', '#1b1a20', '#2b2933', '#1d1a24', '#2a2219', '#0a0910', '#14121f'];
  function teleport(x, z, yaw) {
    const Yu = G.sim.you, Mm = G.sim.mimo;
    Yu.x = x; Yu.z = z; Yu.yaw = yaw; Mm.x = x + 1.1; Mm.z = z + 0.8; Mm.hidden = false; Mm.wander = null; Mm.station = null; Mm.look = null; G.sim.snap();
  }
  function show(i) {
    rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {};
    const room = rooms[i], dark = room && room.dark && !(S().done || {})[i];
    lightT = lightK = dark ? 0.22 : i === 8 ? 0.55 : 1;
    G.w3d.setInterior({ fog: FOG[i] || '#191722', near: dark ? 9 : 14, far: dark ? 30 : 42 });
  }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; show(0);
    const R = ROOMS[0]; teleport(R.x, R.z + 4.2, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5);
    await UI.fade(0, 450);
    await arrive(0);
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(Math.PI, 0.3, 9);      // (the camera out over the stair, looking back at the door)
    await UI.fade(0, 450);
  }
  // (the finale, finale.js: straight up to a floor under its own screen, and out again quietly; no fades, no arrival scene)
  function enterAt(i) { build(); inside = true; show(i); const R = ROOMS[i]; teleport(R.x, R.z + 4.2, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5); }
  function leaveQuiet() { hideAll(); inside = false; G.w3d.setInterior(null); teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); }
  async function go(i, from = 'below') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'above' && room.up) teleport(room.up.x, room.up.z + 0.5, 0); else teleport(R.x, R.z + 4.2, Math.PI);
    G.cam.snap(from === 'above' ? 0 : Math.PI, 0.62, 10.5);
    await UI.fade(0, 350);
    if (from !== 'above') await arrive(i);
    G.save();
  }
  async function arrive(i) {
    const st = S(), R = ROOMS[i];
    if (st['seen' + i]) { if (i === 8 && typeof OLDBOSS !== 'undefined' && OLDBOSS.again) await OLDBOSS.again(G, rooms[8]); return; }
    st['seen' + i] = true;
    await UI.chapter(R.name, i < 8 ? `The Old Tower · ${ORD[i]} floor` : 'The Old Tower · the top');
    if (i === 8) { if (typeof OLDBOSS !== 'undefined' && OLDBOSS.arrive) await OLDBOSS.arrive(G, rooms[8]); return; }
    if (AMBUSH[i] && !st['amb' + i]) {
      const foes = ambushFoes(i);
      if (foes.length) {
        snd('screech');
        await STORY.you('Creatures from every land… The Hush brought them all here!');
        const r = await G.fight({ foes, place: { biome: 'cave', x: Y.door ? Y.door.x : WORLD.L.tower.x, z: Y.door ? Y.door.z : WORLD.L.tower.z } });
        if (!r || r.outcome !== 'win') { st['seen' + i] = false; await go(i - 1, 'above'); return; }
        st['amb' + i] = true;
      }
    }
    await echoScene(i);
  }
  // after the fall (oldtower_boss.js): out of the tower, on the landing, the tear in the door
  function afterFall() {
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(Math.PI, 0.3, 9);
    noteShown = true; applyYard();
  }
  // the Past is the next chapter's: a short note (after the fall, the tear, and when a save from then is loaded)
  let noteShown = false;
  async function comingSoon() {
    noteShown = true;
    if (typeof PAST !== 'undefined' && PAST.nudge) return PAST.nudge();      // (the Past is built: a nudge toward the tear, not the card; past.js)
    const l = lang(), past = OTXT.pick(OTXT.NAMES.past, l);
    await UI.card(`<div class="tag">Chapter 2</div><div class="big" style="font-size:30px">The Past</div><div class="caption">«${UI.esc ? UI.esc(past) : past}»</div>`
      + `<div class="sub" style="font-size:14px;opacity:.8;max-width:340px;margin:6px auto 0">The Past is coming soon! Your game is saved here. Until then, the present is still yours: Alba and everyone you’ve met are waiting.</div><div class="sub">E to close</div>`);
  }

  // ------------------------------------------------------------ per frame (inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur], st = S(), done = st.done || {};
    if (G.sim.lock && !STORY.busy && !(typeof OLDBOSS !== 'undefined' && OLDBOSS.busy && OLDBOSS.busy())) { G.sim.lock = 0; G.cam.override = null; }     // (a scene that broke off never leaves you frozen)
    // the dark floors: the scene's lights dimmed (world3d sets them every frame; this runs after it)
    lightK = damp(lightK, lightT, 1.6, dt);
    if (lightK < 0.995) { if (!lights) lights = G.w3d.scene.children.filter(o => o.isLight && (o.isHemisphereLight || o.isDirectionalLight)); lights.forEach(l => { l.intensity *= lerp(0.16, 1, lightK); }); }
    poseEcho(room.E, dt, t);
    if (room.way && room.way.arrow && room.way.arrow.visible) { const w = room.way; if (w.ay === undefined) w.ay = w.arrow.position.y; w.arrow.position.y = w.ay + Math.sin(t * 4) * 0.12; }
    if (cur === 0) { room.water.material.emissive.setRGB(0.04, 0.14 + 0.03 * Math.sin(t * 1.3), 0.2); if (!done[0] && room.ropeG) room.ropeG.rotation.z = Math.sin(t * 0.9) * 0.02; }
    if (cur === 1 && (room.turning || done[1])) room.gears.forEach((g, k) => { g.rotation.z += dt * (k % 2 ? -0.7 : 0.55); });
    if (cur === 2) room.crystals.forEach((c, k) => { c.lit = damp(c.lit, c.want, 3, dt); c.m.emissive.setRGB(0.1 * c.lit, 0.55 * c.lit, 0.62 * c.lit); c.m.color.set('#4c5a6e').lerp(new THREE.Color('#9ff3ff'), c.lit); c.gl.material.opacity = c.lit * (0.5 + 0.12 * Math.sin(t * 3 + k)); });
    if (cur === 2 && room.doorGlow) room.doorGlow.material.opacity = done[2] ? 0.45 + 0.1 * Math.sin(t * 2) : 0;
    if (cur === 3 && room.blossom && room.blossom.visible) room.blossom.rotation.y = Math.sin(t * 0.4) * 0.01;
    if (cur === 4) room.fog.forEach(f => { if (f.sp.visible && f.k > 0.99) { f.sp.position.x = f.x0 + Math.sin(t * 0.3 + f.ph) * 0.4; f.sp.position.y = f.y0 + Math.sin(t * 0.4 + f.ph) * 0.2; } });
    if (cur === 5) room.birds.forEach((b, k) => {
      if (b.wakeT) b.wake = damp(b.wake, 1, 3, dt);
      b.body.color.set('#8f8a9c').lerp(new THREE.Color(b.col), b.wake); b.wing.color.set('#77728a').lerp(new THREE.Color(b.col).multiplyScalar(0.75), b.wake);
      const flap = b.fly ? Math.sin(t * 30 + k) * 0.9 : b.wake > 0.5 ? Math.sin(t * 2 + k) * 0.05 : 0;
      b.wings.forEach((w, s) => { w.rotation.z = (s ? -1 : 1) * flap; });
      if (!b.fly && b.wake > 0.5) b.g.position.y = b.home.y + Math.abs(Math.sin(t * 3 + k)) * 0.03;
    });
    if (cur === 7) room.shadows.forEach(s => { if (!s.sp.visible) return; s.a += dt * s.sp0 * (Math.sin(s.ph) > 0 ? 1 : -1); const p = at(room.R, s.a, s.r); s.sp.position.set(p.x, s.y + Math.sin(t * 0.8 + s.ph) * 0.3, p.z); });
    if (cur === 8 && typeof OLDBOSS !== 'undefined' && OLDBOSS.updateTop) OLDBOSS.updateTop(room, dt, t);
  }
  // what you can press E on, room by room
  function interactables() {
    const list = [], done = S().done || {}, room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName, y = Y0;
    list.push({ x: R.x, z: R.z + 5.0, y, r: 1.7, label: cur === 0 ? 'Leave the tower' : 'Go back down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
    if (cur < 8) {
      list.push({ x: room.markAt.x, z: room.markAt.z, y, r: 1.4, label: 'Read', run: () => readMark(cur) });
      if (!done[cur] && room.task) list.push({ x: room.task.x, z: room.task.z, y, r: 2.7, label: `Tell ${name}`, run: () => task(cur) });
      else if (done[cur] && room.up) list.push({ x: room.up.x, z: room.up.z, y, r: 2.0, label: room.way.label, run: () => go(cur + 1) });
    } else if (typeof OLDBOSS !== 'undefined' && OLDBOSS.topInteractables) list.push(...OLDBOSS.topInteractables(G, room));
    return list;
  }
  // where the compass points inside: the next thing to do in this room (outside: the door)
  function target() {
    const room = rooms[cur]; if (!room) return null;
    if (cur === 8) return typeof OLDBOSS !== 'undefined' && OLDBOSS.topTarget ? OLDBOSS.topTarget(G, room) : null;
    const done = (S().done || {})[cur];
    return done ? { x: room.up.x, z: room.up.z, hint: '{mimo} points at the way up!' } : { x: room.task.x, z: room.task.z, hint: HINTS[cur] };
  }
  const doorSpot = () => (Y.door ? { x: Y.door.x, z: Y.door.z + 1.6 } : { x: WORLD.L.tower.x, z: WORLD.L.tower.z + 9 });
  // the area's song: the climb (floors 1–8), the music box in the clock room (oldtower_boss.js plays the fight's)
  const song = () => (cur === 8 ? 'oldtower' : typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('ot_climb') ? 'ot_climb' : 'oldtower');

  // ------------------------------------------------------------ init, and the save's state outdoors
  let stateWas = null;
  function init(game) {
    G = game;
    try { OTXT.words(); } catch (e) { console.error('[oldtower] words', e); }
    try { buildYard(); } catch (e) { console.error('[oldtower] yard', e); }
    if (typeof STORY !== 'undefined' && STORY.extra) STORY.extra.push({ interactables: () => (G.indoors && G.indoors() ? [] : outdoorInteractables()), tick: (dt, Yu) => { if (!(G.indoors && G.indoors())) yardTick(dt, Yu); } });
  }
  // (main.js calls this every frame, outdoors and in: a loaded save puts the door, the bag and the tear as they were)
  function outdoorFrame(dt, t) {
    if (!G) return;
    if (typeof OLDBOSS !== 'undefined' && OLDBOSS.frame) OLDBOSS.frame(dt);      // (the fall into the Past: its own screen, stepped by the game's loop)
    if (G.state !== stateWas) { stateWas = G.state; applyYard(); noteShown = false; }
    // (once the Past is under way or done, or while you're in a realm or room, no nudge: only a save from right after the fall gets one)
    const fl = G.state.flags, inRealm = !!(G.indoorMod && G.indoorMod());
    if (!noteShown && fl.towerLost && fl.hatched && !fl.pastIn && !fl.pastDone && !fl.futureIn && !inRealm && !inside && !STORY.busy && !STORY.line && !(G.journalOpen)) { noteShown = true; setTimeout(() => { if (!STORY.busy) STORY.run(comingSoon); }, 1600); }
    outdoor(dt, t);
  }

  return {
    init, enter, leave, update, interactables, target, ROOMS, OUTSIDE, song, doorSpot,
    outdoor: outdoorFrame,
    get inside() { return inside; }, get room() { return cur; }, get yard() { return Y; },
    tearSpot: () => (Y.tear ? { x: Y.tear.x, z: Y.tear.z + 1.6 } : doorSpot()),
    floorsDone: () => Object.keys((S().done) || {}).filter(k => +k < 8).length,
    _: { rooms, S, build, applyState, applyYard, go, show, hideAll, teleport, task, gradeOf, ACT, echoScene, solved, afterFall, comingSoon, ensureVerb, ambushFoes, lineText, Kit, KG, glow, grp, at, mats, Y0, RR, WH, enterAt, leaveQuiet,
      get lightT() { return lightT; }, set lightT(v) { lightT = v; }, doorScene, bagScene, buildYard, Y },
  };
})();

// ============================================================ the main quest's last steps of Chapter 1 (quests.js's way: a wrap of QUESTS.init)
// After the eight bells (the Gray Marsh's last step, whatever it is: these go at the end, and replace a "…Old Tower (coming soon)"
// placeholder if a region left one): climb the Old Tower floor by floor; at the top, Noa; then the Past, coming soon.
(() => {
  if (typeof QUESTS === 'undefined') return;
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addTower(game); } catch (e) { console.error('[quests: oldtower]', e); } };
  function addTower(G) {
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.oldtower)) return;
    for (let i = main.steps.length - 1; i >= 0; i--) { const t = main.steps[i].text; if (typeof t === 'string' && /old tower/i.test(t) && /coming soon/i.test(t)) main.steps.splice(i, 1); }
    const floors = s => Object.keys((s.oldtower && s.oldtower.done) || {}).filter(k => +k < 8).length;
    const inT = () => OLDTOWER.inside;
    main.steps.push(
      { oldtower: true, text: 'Climb the Old Tower: Noa is at the top ({n}/8 floors)', n: s => floors(s),
        get why() { const f = G.state.flags; return f.oldDoor ? 'One verb a floor, said in a whole sentence: every land’s bell lent you one. Noa’s voice is still in there, an echo on every floor: listen to what she said.' : 'All eight {w.bell:pl} are ringing, and the old {w.tower}’s door is open at last. Its stone stair goes up the crag, at the far end of the Gray Marsh. Noa went in before you.'; },
        done: s => floors(s) >= 8 || !!s.flags.towerLost,
        target: () => (inT() ? OLDTOWER.target() : OLDTOWER.doorSpot()),
        get hint() { return G.state.flags.oldDoor ? '{mimo} looks up the stairs. The top is still far!' : '{mimo} stares up at the old {w.tower}. Its door is at the top of the stone stairs.'; } },
      { oldtower: true, text: 'The top of the tower: find Noa',
        why: 'The great {w.clock} is at the very top. Someone is up there… and Noa’s last echo sounded scared.',
        done: s => !!s.flags.towerLost, target: () => (inT() ? OLDTOWER.target() : OLDTOWER.doorSpot()), hint: '{mimo}’s ears go flat. Something is waiting at the top.' },
      { oldtower: true, text: 'Into the Past (coming soon!)',
        why: 'The hooded figure wound the great {w.clock} and flung you and {mimo} into yesterday. Noa is still trapped in the {w.clock}’s face. Chapter 2, the Past, is coming soon.',
        done: () => false, target: () => OLDTOWER.tearSpot(), hint: '{mimo} looks at the tear in time, in the old {w.tower}’s door.' });
    main.story.push(
      { when: s => !!s.flags.oldDoor, text: 'With all eight {w.bell:pl} ringing, the old {w.tower}’s door swung open. On the steps lay Noa’s bag, with every {w.letter} you ever sent her.' },
      { when: s => floors(s) >= 8, text: 'You climbed the {w.tower} floor by floor: water, gears, a dark stair, a gray {w.tree}, fog, birds, sand and shadows. On every floor, an echo of Noa’s voice showed you the way: she had climbed it alone, before you.' },
      { when: s => !!s.flags.towerLost, text: 'At the top, under the great {w.clock}, a hooded figure was waiting. Noa was trapped in the {w.clock}’s face. Your words hit him, but he took them, one by one. Then he wound the {w.clock}, and the world tore: you and {mimo} fell into the Past.' });
  }
})();
