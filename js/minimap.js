'use strict';
// The little map in the top-right corner. The user asked to "add a mini-map, take inspiration from lantern delve's
// mini-map as a reference point. although I don't think we should have fast travel": so it's a guide, not a
// teleporter, and clicking it does nothing.
//
// Like Lantern Delve's (web/js/game/minimap.js there): a paper card with a thick ink outline and a soft shadow, the
// area's name on a colored tab ("The Quiet Forest", "Alba", "The Windmill Hills"…), and in it a close-up of the land
// around you that glides along with you, drawn as a bright picture map with bold edges: meadows and the forest floor,
// round trees that clump into dark woods, roads and trails as tan bands with curbs, the towns' streets and squares,
// roofs, water with an ink edge and a pale shore, rocks, the railway, Molinar's wheat, and gray patches where the Hush
// is. It turns with the camera, so up on the card is where the camera looks (as on the compass strip), and an N on the
// rim shows north. On it: you (a badge, with an arrow the way you face), Mimo (teal), the quest goal (a gold pin, teal
// for a side quest; when it's off the card, an arrow on the rim points to it), townsfolk (gray when hushed), Hushlings
// (red, pulsing when one's after you), and doors. The coin, page and word chips (#counters) sit just under the card.
//
// The land is drawn once into a picture (3 px per unit, about 1730 × 900); each frame only turns and crops it onto
// the card and draws the markers. When a gray patch lifts (w3d.liftHush), only that patch is painted again.
//
//   MINIMAP.init(game)     adds the card (#minimap) and its CSS, and draws the land (once; a few tenths of a second)
//   MINIMAP.update(dt)     every frame. Hidden before Mimo hatches, indoors (game.indoors(), or MILL / INTERIORS / CORN
//                          .inside), in battles and on the title; faded while a scene holds the camera or the teach box
//                          or journal is open
//   MINIMAP.visible        get/set, a switch for scripts. The card shows only while this is on AND the saved setting
//                          KEYS.opts.minimap (core.js, Settings) isn't false; when it's hidden the chips go back up
//   MINIMAP.rebuild()      draws the land again (after a region opens or the map changes)
//   MINIMAP.areaAt(x, z)   the area's { id, name, color } at a spot
//   MINIMAP.stats()        build and frame timings, for tests
// Reads WORLD (world.js, with its water helpers), and KEYS, TOWN, MOLINAR, LAKE, QUESTS, MILL, INTERIORS, CORN and
// ACTORS when they're loaded. From the game: sim (you, Mimo, npcs), cam (yaw, override), state, journalOpen, indoors(),
// town / molinar / lake (people, landmarks, objects) and foeMarks() → [{ x, z, alert }].

const MINIMAP = (() => {
  // ---------------------------------------------------------------- size and look
  const MW = 216, MH = 150;              // the map on the card, in CSS px
  const SCALE = 2.3;                      // CSS px per world unit: the card shows about 94 × 65 units
  const K = 3;                            // px per world unit in the picture of the land
  const YOU_Y = 0.58;                     // how far down the card you sit (a little low, so more of what's ahead shows)
  const TOP = 24, RIGHT = 14, PAD = 5, BORDER = 3, FRAME = 2;
  const CARD_H = MH + 2 * (PAD + BORDER + FRAME);
  const OX = MW / 2, OY = MH * YOU_Y;
  const RV = Math.hypot(Math.max(OX, MW - OX), Math.max(OY, MH - OY)) / SCALE + 1;   // the farthest the card reaches (units)
  const INK = '#2b2235', PAPER = '#fffaf0';
  const AREAS = {
    forest: { name: 'The Quiet Forest', color: '#3f8a4a' }, road: { name: 'The Old Road', color: '#a8743a' },
    alba: { name: 'Alba', color: '#c9553f' }, field: { name: 'The East Field', color: '#7d9a35' },
    hills: { name: 'The Windmill Hills', color: '#cf952a' }, molinar: { name: 'Molinar', color: '#3f6fb5' },
    reeds: { name: 'The Reed Meadows', color: '#3a957a' }, remanso: { name: 'Remanso', color: '#2f8f8a' },
    lake: { name: 'The Mirror Lake', color: '#3a86c4' }, station: { name: 'The End of the Line', color: '#6d5a86' },
    maze: { name: 'The Corn Maze', color: '#b38a24' },
  };
  Object.entries(AREAS).forEach(([id, a]) => { a.id = id; });
  // the ground's colors ([r, g, b]: it's drawn pixel by pixel)
  const MEADOW_A = [170, 216, 112], MEADOW_B = [146, 203, 96], FOREST = [118, 181, 90], WOODS = [62, 117, 64];
  const SAND = [238, 225, 166], SHALLOW = [130, 208, 238], DEEP = [64, 158, 214], FOAM = [232, 247, 255], INKC = [43, 34, 53];
  const WOODS_CSS = 'rgb(62,117,64)', WATER_CSS = 'rgb(130,208,238)', FOAM_CSS = 'rgb(232,247,255)';
  // roads, streets and squares: always lighter than the land, with a darker curb (as on a town map)
  const ROAD = '#f3e0ad', TRAIL = '#ead49d', STREET = '#ede2ca', LANE = '#e7d9ba', PLAZA = '#f5eddc', FLAG = '#eadfc8', DIRT = '#e1c792';
  const CURB = 'rgba(86,66,38,0.6)';
  const WOOD = '#c99b62', WOOD_D = '#94673c', STONE = '#d8cfbb';
  const ROOFS_M = ['#c9643f', '#d27445', '#b85a3a', '#e08a4a', '#c45a3c', '#d9824e', '#bf6a44'];          // Molinar's tiles
  const THATCH = '#d8b35a', SLATE = '#6f8196';
  const ROOF_LAKE = { marina: THATCH, hA: THATCH, hB: SLATE, hC: THATCH, L1: SLATE, L2: THATCH, L3: SLATE, S1: SLATE, S2: THATCH, shed: SLATE };
  const AWN_M = { hats: '#3f6fb5', cheese: '#e6a23a', fruit: '#d9443a', sweets: '#e86a9a', gray: '#8f8c88', bakery: '#d0663f' };

  // ---------------------------------------------------------------- small helpers
  const hexRGB = s => { const n = parseInt(String(s).slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const isHex = s => typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s);
  // lighter (k > 0) or darker (k < 0)
  const tint = (s, k) => { const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); const [r, g, b] = hexRGB(s); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const townL = () => (typeof TOWN !== 'undefined' && TOWN.layout) || null;
  const molL = () => (typeof MOLINAR !== 'undefined' && MOLINAR.layout) || null;
  const lakeL = () => (typeof LAKE !== 'undefined' && LAKE.layout) || null;
  function spline(pts, per = 6) {          // Catmull-Rom, as world.js smooths its roads
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function starPath(c, x, y, r1, r2, n = 5, rot = -Math.PI / 2) {
    c.moveTo(x + Math.cos(rot) * r1, y + Math.sin(rot) * r1);
    for (let i = 1; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + (i * Math.PI) / n; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath();
  }
  function glow(c, x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  // from (ox, oy), along (dx, dy), to the card's rim (inset by m)
  function rimPoint(ox, oy, dx, dy, m) {
    let t = Infinity;
    if (dx > 1e-6) t = Math.min(t, (MW - m - ox) / dx); else if (dx < -1e-6) t = Math.min(t, (m - ox) / dx);
    if (dy > 1e-6) t = Math.min(t, (MH - m - oy) / dy); else if (dy < -1e-6) t = Math.min(t, (m - oy) / dy);
    if (!isFinite(t)) t = 0;
    return [ox + dx * t, oy + dy * t];
  }

  // A soft-edged disc stamped straight into RGBA pixels (px units): far quicker than thousands of little canvas
  // paths. The disc's coverage is kept per quarter pixel of radius. wrap: it wraps round the edges (for tiles).
  const STAMPS = new Map();
  function stampOf(r) {
    const key = Math.max(1, Math.round(r * 4));
    let s = STAMPS.get(key);
    if (!s) {
      const rq = key / 4, h = Math.ceil(rq + 0.5), n = 2 * h + 1, m = new Float32Array(n * n);
      for (let y = -h; y <= h; y++) for (let x = -h; x <= h; x++) m[(y + h) * n + x + h] = clamp(rq + 0.5 - Math.hypot(x, y), 0, 1);
      STAMPS.set(key, s = { h, n, m });
    }
    return s;
  }
  function stamp(D, bw, bh, cx, cy, r, col, a = 1, wrap = false) {
    const s = stampOf(r), h = s.h, n = s.n, m = s.m, ix = Math.floor(cx) - h, iy = Math.floor(cy) - h, R = col[0], Gc = col[1], B = col[2];
    if (!wrap) {
      if (ix < 0 || iy < 0 || ix + n > bw || iy + n > bh) return;
      for (let y = 0; y < n; y++) {
        let o = ((iy + y) * bw + ix) * 4, q = y * n;
        for (let x = 0; x < n; x++, o += 4, q++) {
          const cov = m[q] * a;
          if (cov > 0) { D[o] += (R - D[o]) * cov; D[o + 1] += (Gc - D[o + 1]) * cov; D[o + 2] += (B - D[o + 2]) * cov; }
        }
      }
      return;
    }
    for (let y = 0; y < n; y++) {
      const py = (((iy + y) % bh) + bh) % bh;
      for (let x = 0, q = y * n; x < n; x++, q++) {
        const cov = m[q] * a; if (cov <= 0) continue;
        const o = (py * bw + ((((ix + x) % bw) + bw) % bw)) * 4;
        D[o] += (R - D[o]) * cov; D[o + 1] += (Gc - D[o + 1]) * cov; D[o + 2] += (B - D[o + 2]) * cov;
      }
    }
  }
  // The deep woods' canopy: a tile of round treetops (edges, leaves, a highlight) that repeats under the whole map.
  // (Where the ground is meadow it's covered; where the woods are solid it shows. Real trees go on top.)
  let canopy = null;
  function canopyTile() {
    if (canopy) return canopy;
    const sp = 3.5 * K, T = Math.round(sp * 20), cvT = document.createElement('canvas'); cvT.width = cvT.height = T;
    const c = cvT.getContext('2d'), img = c.createImageData(T, T), D = img.data, R = rng(777), blobs = [];
    for (let o = 0; o < D.length; o += 4) { D[o] = WOODS[0]; D[o + 1] = WOODS[1]; D[o + 2] = WOODS[2]; D[o + 3] = 255; }
    for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) blobs.push([(i + 0.1 + R() * 0.8) * sp, (j + 0.1 + R() * 0.8) * sp, (1.2 + 0.8 * (0.9 + R() * 0.6)) * K]);
    for (const [x, y, r] of blobs) stamp(D, T, T, x, y, r + 1.3, [36, 69, 42], 1, true);
    for (const [x, y, r] of blobs) stamp(D, T, T, x, y, r, [69, 126, 68], 1, true);
    for (const [x, y, r] of blobs) stamp(D, T, T, x - r * 0.3, y - r * 0.3, r * 0.5, [255, 255, 255], 0.09, true);
    c.putImageData(img, 0, 0);
    return (canopy = cvT);
  }

  // ---------------------------------------------------------------- which area you're in (the name on the tab)
  function areaAt(x, z) {
    const L = WORLD.L;
    { const rm = ownRoom(); if (rm && rm.areaAt) { const a = rm.areaAt(x, z); if (a) return a; } }     // (a room with a map of its own: Meridiana, js/ch5/mer_city.js)
    if (typeof PAST !== 'undefined' && PAST.areaAt) { const a = PAST.areaAt(x, z); if (a) return a; }     // (the Past: Alba and the Old Quarter, long ago)
    if (typeof FUTURE !== 'undefined' && FUTURE.areaAt) { const a = FUTURE.areaAt(x, z); if (a) return a; }     // (the Future: Alba tomorrow)
    if (typeof TIME !== 'undefined' && TIME.areaAt) { const a = TIME.areaAt(x, z); if (a) return a; }     // (another region's Past or Future, time.js)
    const fm = L.farm;        // the corn maze's field (first: its north edge runs close to Alba's south gate)
    if (fm && x > fm.x0 && x < fm.x1 && z < fm.z0 && z > fm.z1) return AREAS.maze;
    if (typeof MARSH !== 'undefined' && MARSH.areaAt) { const a = MARSH.areaAt(x, z); if (a) return a; }     // (past the old north road's gate: the Gray Marsh, Candil, the Drowned Chapel, the Old Tower)
    if (typeof CEMETERY !== 'undefined' && CEMETERY.areaAt) { const a = CEMETERY.areaAt(x, z); if (a) return a; }     // (north of Alba: the Old Quarter, the Brick Road, the Cemetery)
    if (typeof CAVES !== 'undefined' && CAVES.areaAt) { const a = CAVES.areaAt(x, z); if (a) return a; }     // (the far north: the Quarry Road, the Miners' Camp)
    if (typeof PEAKS !== 'undefined' && PEAKS.areaAt) { const a = PEAKS.areaAt(x, z); if (a) return a; }     // (the north-east: the Frost Pass, Escarcha, the Ice Clock Tower)
    if (typeof PORT !== 'undefined' && PORT.areaAt) { const a = PORT.areaAt(x, z); if (a) return a; }     // (south of the lake: the Brisa Road, Port Brisa, the Sea Fort)
    if (typeof RUINS !== 'undefined' && RUINS.areaAt) { const a = RUINS.areaAt(x, z); if (a) return a; }     // (the south-east canyon: the Sunken Cove, the Dig Camp, the Old Town, the Sunken Temple)
    if (typeof GARDENS !== 'undefined' && GARDENS.areaAt) { const a = GARDENS.areaAt(x, z); if (a) return a; }     // (south-east of Molinar: the Garden Road, the Bloom Gardens)
    if (Math.hypot(x - L.town.x, z - L.town.z) < L.town.r + 3) return AREAS.alba;
    if (L.molinar && Math.hypot(x - L.molinar.x, z - L.molinar.z) < L.molinar.r + 3) return AREAS.molinar;
    if (typeof LAKE !== 'undefined' && LAKE.areaAt) { const a = LAKE.areaAt(x, z); if (a) return a; }     // (the Mirror Lake's island: Lighthouse Island, lake.js)
    const rv = L.remanso;
    if (rv && x > rv.x0 - 36 && x < rv.x1 + 6 && z < rv.z0 + 6 && z > rv.z1 - 6) return AREAS.remanso;     // (its boardwalks reach out over the lake)
    if (L.lake && (typeof lakeD === 'function' ? lakeD(x, z) < -1 : typeof lakeE === 'function' && lakeE(x, z) < 0.97)) return AREAS.lake;     // (the whole grown lake, world.js)
    const st = L.station;     // the platform, the station house and the yard around them
    if (st && x > st.x0 - 8 && x < st.x1 + 16 && z > st.z0 - 9) return AREAS.station;
    if (z > -36) return AREAS.forest;
    if (x > 88) return AREAS.hills;
    if (x < -45) return AREAS.reeds;
    if (x > 30) return AREAS.field;
    return AREAS.road;
  }

  // ---------------------------------------------------------------- the card
  let G = null, root = null, cv = null, ctx = null, tabEl = null;
  let land = null, visible = true, bodyOn = null, cardOn = null, area = null, areaT = 0;
  let T = 0, lastTime = null, view = null, topShade = null, bgPattern = null, boulder = null, boulderT = 0, doors = [], doorsT = -9, warned = {};
  const timing = { build: 0, parts: {}, ms: new Float32Array(240), n: 0, i: 0, max: 0, last: 0 };
  const warnOnce = (key, e) => { if (warned[key]) return; warned[key] = true; console.warn('[minimap] ' + key, e); };

  function addCSS() {
    if (document.getElementById('minimap-css')) return;
    const s = document.createElement('style'); s.id = 'minimap-css';
    s.textContent = `
#minimap { position: fixed; top: ${TOP}px; right: ${RIGHT}px; z-index: 5; pointer-events: none; opacity: 0; visibility: hidden;
  transition: opacity .3s, visibility 0s linear .3s; transform-origin: 100% 0; }
#minimap.on { opacity: 1; visibility: visible; transition: opacity .3s; }
#minimap .mm-card { position: relative; padding: ${PAD}px; background: var(--paper, ${PAPER}); border: ${BORDER}px solid var(--ink, ${INK}); border-radius: 17px;
  box-shadow: 0 4px 0 rgba(43,34,53,.24), 0 7px 16px rgba(20,12,36,.18); }
#minimap canvas { display: block; width: ${MW}px; height: ${MH}px; border: ${FRAME}px solid var(--ink, ${INK}); border-radius: 11px; background: ${WOODS_CSS}; }
#minimap .mm-tab { position: absolute; left: 12px; top: -14px; max-width: ${MW - 40}px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font: 800 12px/16px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .02em; color: #fffaf0; background: ${AREAS.forest.color};
  border: 2px solid var(--ink, ${INK}); border-radius: 10px; padding: 1px 10px 2px; box-shadow: 0 2px 0 rgba(43,34,53,.25); transition: background-color .5s; }
#counters { transition: top .3s; }
body.mm-on #counters { top: ${TOP + CARD_H + 10}px; }
body.on-title #minimap, body.in-battle #minimap { display: none !important; }
@media (max-width: 900px), (max-height: 520px) { #minimap { transform: scale(.78); } body.mm-on #counters { top: ${Math.round(TOP + CARD_H * 0.78 + 8)}px; } }
`;
    document.head.appendChild(s);
  }
  function addCard() {
    root = document.getElementById('minimap');
    if (!root) { root = document.createElement('div'); root.id = 'minimap'; document.body.appendChild(root); }
    root.innerHTML = '<div class="mm-card"><canvas width="216" height="150"></canvas><div class="mm-tab"></div></div>';
    cv = root.querySelector('canvas'); ctx = cv.getContext('2d'); tabEl = root.querySelector('.mm-tab');
  }
  function setBody(on) { if (on === bodyOn) return; bodyOn = on; document.body.classList.toggle('mm-on', on); }
  function setCard(on) { if (on === cardOn) return; cardOn = on; root.classList.toggle('on', on); }

  // ---------------------------------------------------------------- the picture of the land (drawn once)
  // x across, z down (north, −z, is up): px = (x − X0)·K, py = (z − Z0)·K
  function drawLand() {
    const t0 = performance.now(), W = WORLD, WL = W.L, GW = W.GW, GH = W.GH, HH = W.H, WATER = WL.water;
    const X0 = WL.minX - 0.5, Z0 = WL.minZ - 0.5, CW = GW * K, CH = GH * K, PX = 1 / K;
    const parts = {}, errors = [];
    let tp = t0;
    const lap = name => { const n = performance.now(); parts[name] = +(n - tp).toFixed(1); tp = n; };
    const safe = (name, fn) => { try { fn(); } catch (e) { errors.push(name); console.warn('[minimap] ' + name, e); } lap(name); };

    // 1. how far each spot is from anywhere you're meant to be (a coarse grid: it's a distance, so it reads back
    //    smoothly). Past about 9 units the trees are a wall: there, the ground turns into dark woods.
    const PS = 12, pw = Math.ceil((GW - 1) / PS) + 1, ph = Math.ceil((GH - 1) / PS) + 1, PD = new Float32Array(pw * ph);
    for (let j = 0; j < ph; j++) for (let i = 0; i < pw; i++) PD[j * pw + i] = W.playDist(Math.min(WL.minX + i * PS, WL.maxX), Math.min(WL.minZ + j * PS, WL.maxZ));
    lap('reach');

    // 2. the ground's color at each grid point, as seen (into a little picture, a pixel per point) and as if there were
    //    no water (for the shore, below)
    const N = GW * GH, dryC = new Float32Array(N * 3);
    const nodes = document.createElement('canvas'); nodes.width = GW; nodes.height = GH;
    const nctx = nodes.getContext('2d', { willReadFrequently: true }), nimg = nctx.createImageData(GW, GH), ND = nimg.data;
    const ss = (e0, e1, x) => { let t = (x - e0) / (e1 - e0); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
    const colI = new Int32Array(GW), colU = new Float32Array(GW);       // (each column's place on the reach grid)
    for (let i = 0; i < GW; i++) { const fx = Math.min(i / PS, pw - 1.001); colI[i] = fx | 0; colU[i] = fx - (fx | 0); }
    for (let j = 0; j < GH; j++) {
      const z = WL.minZ + j, jm = Math.max(0, j - 1) * GW, jp = Math.min(GH - 1, j + 1) * GW, row = j * GW, cz = Math.cos(z * 0.11) * 2;
      const fz = Math.min(j / PS, ph - 1.001), pj = (fz | 0) * pw, pv = fz - (fz | 0);
      for (let i = 0; i < GW; i++) {
        const k = row + i, x = WL.minX + i, h = HH[k];
        const v = 0.5 + 0.5 * Math.sin(x * 0.13 + cz);
        let r = MEADOW_A[0] + (MEADOW_B[0] - MEADOW_A[0]) * v, g = MEADOW_A[1] + (MEADOW_B[1] - MEADOW_A[1]) * v, b = MEADOW_A[2] + (MEADOW_B[2] - MEADOW_A[2]) * v;
        const f = W.forestAt(x, z) * 0.85;
        r += (FOREST[0] - r) * f; g += (FOREST[1] - g) * f; b += (FOREST[2] - b) * f;
        const pk = pj + colI[i], pu = colU[i];
        const pd = (PD[pk] * (1 - pu) + PD[pk + 1] * pu) * (1 - pv) + (PD[pk + pw] * (1 - pu) + PD[pk + pw + 1] * pu) * pv;
        // the light comes from the north-west (top left, north up), so hills stand up off the ground, in two tones
        const gx = HH[row + (i < GW - 1 ? i + 1 : i)] - HH[row + (i > 0 ? i - 1 : i)], gz = HH[jp + i] - HH[jm + i];
        const s = (gx + gz) * 0.2, lit = 0.13 * ss(0.03, 0.11, s), dark = 0.15 * ss(0.03, 0.11, -s);
        r += (255 - r) * lit - r * dark; g += (255 - g) * lit - g * dark; b += (255 - b) * lit - b * dark;
        // sand where the ground dips toward the water
        const sd = h < WATER + 0.6 ? ss(WATER + 0.6, WATER + 0.12, h) * 0.9 : 0;
        r += (SAND[0] - r) * sd; g += (SAND[1] - g) * sd; b += (SAND[2] - b) * sd;
        // in the woods the canopy shows through (the picture is see-through there); the shore uses the flat woods color
        const w = ss(9.5, 12.5, pd), o = k * 3, q = k * 4;
        dryC[o] = r + (WOODS[0] - r) * w; dryC[o + 1] = g + (WOODS[1] - g) * w; dryC[o + 2] = b + (WOODS[2] - b) * w;
        if (h < WATER) { const d = smoothstep(0, 1.3, WATER - h); ND[q] = SHALLOW[0] + (DEEP[0] - SHALLOW[0]) * d; ND[q + 1] = SHALLOW[1] + (DEEP[1] - SHALLOW[1]) * d; ND[q + 2] = SHALLOW[2] + (DEEP[2] - SHALLOW[2]) * d; ND[q + 3] = 255; }
        else { ND[q] = r; ND[q + 1] = g; ND[q + 2] = b; ND[q + 3] = 255 * (1 - w); }
      }
    }
    nctx.putImageData(nimg, 0, 0);
    lap('ground');

    // 3. the picture: the little one spread smoothly (bilinear) over K × K px per grid point. Then, along the water
    //    (the grid cells where the ground crosses the waterline), the edge is worked out per pixel, so it's crisp:
    //    land, an ink line, pale foam, then water that deepens away from the shore.
    const work = document.createElement('canvas'); work.width = CW; work.height = CH;
    const wc = work.getContext('2d', { willReadFrequently: true });
    wc.fillStyle = wc.createPattern(canopyTile(), 'repeat'); wc.fillRect(0, 0, CW, CH);
    wc.imageSmoothingEnabled = true; wc.imageSmoothingQuality = 'low';
    wc.drawImage(nodes, 0, 0, GW, GH, 0, 0, CW, CH);
    const img = wc.getImageData(0, 0, CW, CH), D = img.data;
    const INKW = 1.6 * PX, FOAMW = 0.8;
    for (let j = 0; j < GH - 1; j++) {
      const py0 = Math.ceil((j + 0.5) * K - 0.5), py1 = Math.min(CH - 1, Math.ceil((j + 1.5) * K - 0.5) - 1);
      for (let i = 0; i < GW - 1; i++) {
        const k = j * GW + i, a = HH[k], bb = HH[k + 1], c = HH[k + GW], e = HH[k + GW + 1], lo = Math.min(a, bb, c, e);
        if (!(lo < WATER + 0.8 && Math.max(a, bb, c, e) > WATER - 1.4)) continue;
        const wet = lo < WATER;         // (dry land in a cell that touches water is drawn again too: the smooth picture tints it blue)
        const px0 = Math.ceil((i + 0.5) * K - 0.5), px1 = Math.min(CW - 1, Math.ceil((i + 1.5) * K - 0.5) - 1), k0 = k * 3, k1 = k0 + 3, k2 = k0 + GW * 3, k3 = k2 + 3;
        for (let py = py0; py <= py1; py++) {
          const v = (py + 0.5) / K - 0.5 - j, iv = 1 - v;
          for (let px = px0; px <= px1; px++) {
            const u = (px + 0.5) / K - 0.5 - i, iu = 1 - u, w00 = iu * iv, w10 = u * iv, w01 = iu * v, w11 = u * v, o = (py * CW + px) * 4;
            let r = dryC[k0] * w00 + dryC[k1] * w10 + dryC[k2] * w01 + dryC[k3] * w11;
            let g = dryC[k0 + 1] * w00 + dryC[k1 + 1] * w10 + dryC[k2 + 1] * w01 + dryC[k3 + 1] * w11;
            let b = dryC[k0 + 2] * w00 + dryC[k1 + 2] * w10 + dryC[k2 + 2] * w01 + dryC[k3 + 2] * w11;
            const h = a * w00 + bb * w10 + c * w01 + e * w11;
            const du = (bb - a) * iv + (e - c) * v, dv = (c - a) * iu + (e - bb) * u;
            const sd = (h - WATER) / Math.max(0.07, Math.sqrt(du * du + dv * dv));      // how far from the waterline (units; + on land)
            if (sd >= 0.5 && !wet) continue;
            if (sd < 0.5) {
              const dep = smoothstep(0, 1.3, WATER - h);
              let wr = SHALLOW[0] + (DEEP[0] - SHALLOW[0]) * dep, wg = SHALLOW[1] + (DEEP[1] - SHALLOW[1]) * dep, wb = SHALLOW[2] + (DEEP[2] - SHALLOW[2]) * dep;
              const foam = 1 - smoothstep(INKW + FOAMW - 0.3, INKW + FOAMW + 0.25, -sd);
              wr += (FOAM[0] - wr) * foam; wg += (FOAM[1] - wg) * foam; wb += (FOAM[2] - wb) * foam;
              const ink = clamp(0.5 + (sd + INKW) * K, 0, 1) * 0.92;
              wr += (INKC[0] - wr) * ink; wg += (INKC[1] - wg) * ink; wb += (INKC[2] - wb) * ink;
              const lt = clamp(0.5 + sd * K, 0, 1);
              r = wr + (r - wr) * lt; g = wg + (g - wg) * lt; b = wb + (b - wb) * lt;
            }
            D[o] = r; D[o + 1] = g; D[o + 2] = b;
          }
        }
      }
    }
    lap('pixels');

    // 4. rocks, flowers and trees, stamped straight into the pixels. Trees: every dark edge first, then all the
    //    leaves, so a wood reads as one clump with an edge; the wall trees are darker, and merge into the canopy.
    const splat = (cx, cy, r, col, a = 1) => stamp(D, CW, CH, cx, cy, r, col, a);
    const SX = x => (x - X0) * K, SY = z => (z - Z0) * K;
    safe('rocks', () => {
      const rocks = W.rocks || [], rr = r => (0.42 + r.s * 0.72) * K;
      for (const r of rocks) splat(SX(r.x) + 0.8, SY(r.z) + 1, rr(r), INKC, 0.25);
      for (const r of rocks) splat(SX(r.x), SY(r.z), rr(r) + 1.2, [110, 104, 120]);
      for (const r of rocks) splat(SX(r.x), SY(r.z), rr(r), [195, 189, 199]);
      for (const r of rocks) { if (r.moss) splat(SX(r.x) - 0.5, SY(r.z) - 0.6, rr(r) * 0.55, [134, 178, 94]); splat(SX(r.x) - 0.3 * rr(r), SY(r.z) - 0.3 * rr(r), rr(r) * 0.32, [255, 255, 255], 0.35); }
      for (const f of W.flowers || []) { if (f.col && f.col[0] === '#') splat(SX(f.x), SY(f.z), 0.36 * K, hexRGB(f.col)); }
    });
    safe('trees', () => {
      const all = W.trees || [], walls = [], normal = [];
      for (const t of all) (t.wall ? walls : normal).push(t);
      const wallR = t => (1.2 + 0.8 * t.s) * K, treeR = t => (t.kind === 'big' ? 3.4 : 1.05 + 0.62 * t.s) * K;
      const LEAF = { round: [95, 176, 78], pine: [63, 143, 92], birch: [147, 207, 99], big: [85, 168, 69] };
      for (const t of walls) splat(SX(t.x), SY(t.z), wallR(t) + 1.3, [36, 69, 42]);
      for (const t of normal) splat(SX(t.x), SY(t.z), treeR(t) + 1.3, [44, 101, 51]);
      for (const t of walls) splat(SX(t.x), SY(t.z), wallR(t), [69, 126, 68]);
      for (const t of normal) splat(SX(t.x), SY(t.z), treeR(t), LEAF[t.kind] || LEAF.round);
      for (const t of walls) { const r = wallR(t); splat(SX(t.x) - r * 0.3, SY(t.z) - r * 0.3, r * 0.5, [255, 255, 255], 0.09); }
      for (const t of normal) { const r = treeR(t); splat(SX(t.x) - r * 0.32, SY(t.z) - r * 0.32, r * 0.42, [255, 255, 255], 0.24); }
      timing.trees = walls.length + normal.length;
    });
    wc.putImageData(img, 0, 0);
    lap('write');

    // 5. everything else, drawn in world units on top: the railway, fields, roads, water by hand, roofs…
    wc.setTransform(K, 0, 0, K, -X0 * K, -Z0 * K);
    wc.lineJoin = 'round'; wc.lineCap = 'round';
    const line = pts => { wc.beginPath(); wc.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) wc.lineTo(pts[i][0], pts[i][1]); };
    const obb = (b, grow = 0) => {      // a turned box { x, z, hw, hd, rot } (rot: the mesh's rotation.y)
      wc.save(); wc.translate(b.x, b.z); wc.rotate(-(b.rot || 0)); wc.rect(-b.hw - grow, -b.hd - grow, (b.hw + grow) * 2, (b.hd + grow) * 2); wc.restore();
    };
    const dry = (x, z) => W.terrainAt(x, z) > WATER + 0.02;
    // a road's dry stretches (it stops at the water: bridges and stepping stones are drawn over the gap)
    function dryRuns(pts) {
      const runs = []; let cur = null;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5));
        for (let s = i === 0 ? 0 : 1; s <= n; s++) {
          const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n;
          if (dry(x, z)) { if (!cur) { cur = []; runs.push(cur); } cur.push([x, z]); } else cur = null;
        }
      }
      return runs.filter(r => r.length > 1);
    }
    // points every `step` along a line, with its direction
    function walkLine(pts, step, fn) {
      let carry = step / 2;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1], l = Math.hypot(bx - ax, bz - az);
        if (l < 1e-6) continue;
        const ux = (bx - ax) / l, uz = (bz - az) / l;
        let s = carry;
        for (; s <= l; s += step) fn(ax + ux * s, az + uz * s, ux, uz);
        carry = s - l;
      }
    }

    // ---- the corn maze by the old road: one tall corn field (its walls aren't drawn: the card mustn't solve the maze)
    safe('farm', () => {
      const F = WL.farm; if (!F) return;
      const x0 = F.x0, x1 = F.x1, z0 = Math.min(F.z0, F.z1), z1 = Math.max(F.z0, F.z1);
      wc.fillStyle = '#c8b04a'; wc.fillRect(x0, z0, x1 - x0, z1 - z0);
      wc.strokeStyle = 'rgba(122,140,52,0.75)'; wc.lineWidth = 0.7; wc.beginPath();      // stalks: short dashes in loose rows
      for (let z = z0 + 0.8; z < z1 - 0.4; z += 1.3) for (let x = x0 + 0.6 + ((z * 7) % 1.1); x < x1 - 0.4; x += 1.7) { wc.moveTo(x, z); wc.lineTo(x + 0.25, z + 0.7); }
      wc.stroke();
      wc.strokeStyle = 'rgba(43,34,53,0.55)'; wc.lineWidth = 1.2 * PX; wc.strokeRect(x0, z0, x1 - x0, z1 - z0);
    });

    // ---- the railway (from the buffer stop to the tunnel mouth), the platform and the station house
    safe('railway', () => {
      const TR = W.TRACK;
      let rail = null, portal = null;
      if (TR && TR.pts && TR.len) {
        const sEnd = TR.sPortal != null ? TR.sPortal : TR.total;
        rail = [];
        for (let i = 0; i < TR.pts.length && TR.len[i] <= sEnd + 1e-6; i++) rail.push(TR.pts[i]);
        portal = TR.portal || (TR.at ? TR.at(sEnd) : null);
        if (portal && rail.length && Math.hypot(rail[rail.length - 1][0] - portal.x, rail[rail.length - 1][1] - portal.z) > 0.05) rail.push([portal.x, portal.z]);
      } else if (WL.rails != null) rail = [[WL.minX, WL.rails], [WL.maxX, WL.rails]];
      if (!rail || rail.length < 2) return;
      wc.strokeStyle = 'rgba(150,132,104,0.45)'; wc.lineWidth = 3.4; line(rail); wc.stroke();     // the bed
      wc.lineCap = 'butt'; wc.strokeStyle = '#7b5a42'; wc.lineWidth = 0.5; wc.beginPath();         // the ties
      walkLine(rail, 1.4, (x, z, ux, uz) => { wc.moveTo(x - uz * 1.3, z + ux * 1.3); wc.lineTo(x + uz * 1.3, z - ux * 1.3); });
      wc.stroke(); wc.lineCap = 'round';
      wc.strokeStyle = '#3d3a48'; wc.lineWidth = 0.42; line(rail); wc.stroke();                   // the line
      // the tunnel mouth: a dark arch in a stone face, across the line
      if (portal) {
        const ux = portal.ux != null ? portal.ux : 1, uz = portal.uz != null ? portal.uz : 0;
        wc.save(); wc.translate(portal.x, portal.z); wc.rotate(Math.atan2(uz, ux));
        wc.fillStyle = '#9a9384'; wc.strokeStyle = INK; wc.lineWidth = 1.3 * PX;
        wc.beginPath(); wc.rect(-0.2, -3.2, 2.2, 6.4); wc.fill(); wc.stroke();
        wc.fillStyle = '#231c2c'; wc.beginPath(); wc.arc(0.2, 0, 1.7, -Math.PI / 2, Math.PI / 2); wc.closePath(); wc.fill();
        wc.restore();
      }
      // the buffer stop at the end of the line
      const a = TR && TR.at ? TR.at(0) : { x: rail[0][0], z: rail[0][1] };
      wc.fillStyle = '#d64b3c'; wc.strokeStyle = INK; wc.lineWidth = 1.1 * PX; wc.beginPath(); wc.rect(a.x - 0.9, a.z - 1.1, 0.7, 2.2); wc.fill(); wc.stroke();
      // the platform (planks, the yellow line at the track edge), its steps and ramp, and the station house
      const S = WL.station;
      if (S) {
        wc.fillStyle = 'rgba(25,16,40,0.25)'; wc.fillRect(S.x0 + 0.3, S.z0 + 0.4, S.x1 - S.x0, S.z1 - S.z0);
        wc.fillStyle = '#c49b6a'; wc.fillRect(S.x0, S.z0, S.x1 - S.x0, S.z1 - S.z0);
        wc.strokeStyle = '#ad8656'; wc.lineWidth = 0.9 * PX; wc.beginPath();
        for (let x = S.x0 + 1.1; x < S.x1 - 0.2; x += 1.1) { wc.moveTo(x, S.z0); wc.lineTo(x, S.z1); }
        wc.stroke();
        wc.fillStyle = '#f2c94e'; wc.fillRect(S.x0, S.z1 - 0.45, S.x1 - S.x0, 0.22);
        wc.fillStyle = '#a88358'; wc.fillRect(-2.4, S.z0 - 2.3, 4.8, 2.3);                         // the steps down toward the forest path
        if (S.x1 < 14) { wc.beginPath(); wc.moveTo(S.x1, S.z0); wc.lineTo(S.x1 + 3.4, S.z0 + 0.6); wc.lineTo(S.x1 + 3.4, S.z1 - 0.6); wc.lineTo(S.x1, S.z1); wc.closePath(); wc.fill(); }   // the ramp
        wc.strokeStyle = INK; wc.lineWidth = 1.3 * PX; wc.strokeRect(S.x0, S.z0, S.x1 - S.x0, S.z1 - S.z0);
      }
    });

    // ---- Molinar's farm and its wheat
    safe('wheat', () => {
      const ML = molL(); if (!ML) return;
      const F = ML.farm;
      if (F) {
        wc.fillStyle = DIRT;
        if (F.yard) { wc.beginPath(); wc.ellipse(F.yard.x, F.yard.z, F.yard.rx, F.yard.rz, 0, 0, TAU); wc.fill(); }
        if (F.track) wc.fillRect(F.track.x0, F.track.z - F.track.w / 2, F.track.x1 - F.track.x0, F.track.w);
        if (F.pen) {
          const p = F.pen; wc.fillStyle = 'rgba(214,190,140,0.55)'; wc.fillRect(p.x0, p.z0, p.x1 - p.x0, p.z1 - p.z0);
          wc.strokeStyle = '#9a6a3e'; wc.lineWidth = 0.3; wc.strokeRect(p.x0, p.z0, p.x1 - p.x0, p.z1 - p.z0);
        }
      }
      for (const f of ML.fields || []) {
        wc.fillStyle = '#f0c14e'; wc.beginPath(); obb(f); wc.fill();
        wc.save(); wc.translate(f.x, f.z); wc.rotate(-(f.rot || 0));
        wc.strokeStyle = '#d6a038'; wc.lineWidth = 0.32; wc.beginPath();
        for (let z = -f.hd + 0.7; z < f.hd - 0.3; z += 0.9) { wc.moveTo(-f.hw + 0.4, z); wc.lineTo(f.hw - 0.4, z); }
        wc.stroke();
        wc.strokeStyle = '#a87a2a'; wc.lineWidth = 1.4 * PX; wc.strokeRect(-f.hw, -f.hd, f.hw * 2, f.hd * 2);
        wc.restore();
      }
    });

    // ---- roads, trails, streets, footpaths and squares: every curb first, then every band, so where they meet they join up
    safe('roads', () => {
      const strokes = [], areas = [];
      const add = (pts, w, fill, cut = true) => { if (!pts || pts.length < 2) return; for (const run of cut ? dryRuns(pts) : [pts]) strokes.push({ pts: run, w, fill }); };
      const P = W.PATH || spline(WL.path);
      let cur = [P[0]], wide = P[0][1] < -34;                     // the forest path, then (out of the forest) the wider old road
      for (let i = 1; i < P.length; i++) {
        cur.push(P[i]);
        const w2 = P[i][1] < -34;
        if (w2 !== wide || i === P.length - 1) { add(cur, wide ? 3.6 : 2.8, ROAD); cur = [P[i]]; wide = w2; }
      }
      for (const t of W.TRAILS || []) add(t, 1.8, TRAIL);
      if (WL.eastRoad) add(spline(WL.eastRoad), 3.6, ROAD);
      if (WL.westRoad) add(spline(WL.westRoad), 3.6, ROAD);
      const TL = townL();
      if (TL) {
        for (const s of TL.streets || []) add(s.pts, s.w, s.lane ? LANE : STREET, false);
        for (const p of TL.paths || []) add(p, 1.5, DIRT, false);
        for (const p of TL.paved || []) areas.push({ c: p, fill: p.kind === 'plaza' ? PLAZA : p.kind === 'dirt' ? DIRT : FLAG });
        for (const b of TL.dirt || []) areas.push({ b, fill: DIRT });
      }
      const ML = molL();
      if (ML) {
        for (const s of ML.streets || []) add(s.pts, s.w, s.lane ? LANE : STREET, false);
        for (const p of ML.paths || []) add(p, 1.5, DIRT, false);
        for (const p of ML.hillPaths || []) add(p.pts, p.w, TRAIL);
        for (const p of ML.paved || []) areas.push({ c: p, fill: p.kind === 'square' ? PLAZA : FLAG });
        for (const m of ML.mills || []) areas.push({ c: { x: m.x, z: m.z, r: m.r * 1.42 }, fill: TRAIL });
      }
      const KL = lakeL();
      if (KL) {
        if (KL.street) add(KL.street.pts, KL.street.w, STREET, false);
        for (const p of KL.paths || []) add(p, 1.5, DIRT);
        if (KL.plaza) areas.push({ c: KL.plaza, fill: PLAZA });
      }
      const areaPath = (a, grow) => { wc.beginPath(); if (a.c) { wc.moveTo(a.c.x + a.c.r + grow, a.c.z); wc.arc(a.c.x, a.c.z, a.c.r + grow, 0, TAU); } else obb(a.b, grow); };
      wc.strokeStyle = CURB; wc.fillStyle = CURB;
      for (const s of strokes) { wc.lineWidth = s.w + (s.w < 2 ? 1.8 : 2.6) * PX; line(s.pts); wc.stroke(); }
      for (const a of areas) { areaPath(a, 1.3 * PX); wc.fill(); }
      for (const s of strokes) { wc.strokeStyle = s.fill; wc.lineWidth = s.w; line(s.pts); wc.stroke(); }
      for (const a of areas) { wc.fillStyle = a.fill; areaPath(a, 0); wc.fill(); }
    });

    // ---- water drawn by hand: Alba's duck pond and fountain; bridges, logs, stepping stones; Remanso's boardwalks
    const decks = [];        // wooden walks: [ax, az, bx, bz, w]
    safe('water', () => {
      const TLM = typeof TOWN !== 'undefined' && TOWN.landmarks;
      if (TLM && TLM.pond) {          // (town.js: two round pools, a footbridge over the waist)
        const P0 = TLM.pond, pools = [[P0.x - 2.6, P0.z + 1.3, 3.7], [P0.x + 3.2, P0.z - 1.1, 3.1]];
        const disc = (grow, fill) => { wc.fillStyle = fill; wc.beginPath(); for (const [x, z, r] of pools) { wc.moveTo(x + r + grow, z); wc.arc(x, z, r + grow, 0, TAU); } wc.fill(); };
        disc(INKW, INK); disc(0, FOAM_CSS); disc(-0.75, WATER_CSS);
        const bx = P0.x + 0.6, bz = P0.z, ux = 0.382, uz = 0.924;
        decks.push([bx - ux * 2.5, bz - uz * 2.5, bx + ux * 2.5, bz + uz * 2.5, 1.4]);
      }
      if (TLM && TLM.fountain) {
        const F = TLM.fountain;
        wc.fillStyle = STONE; wc.strokeStyle = INK; wc.lineWidth = 1.3 * PX; wc.beginPath(); wc.arc(F.x, F.z, 2.95, 0, TAU); wc.fill(); wc.stroke();
        wc.fillStyle = WATER_CSS; wc.beginPath(); wc.arc(F.x, F.z, 2.38, 0, TAU); wc.fill();
        wc.fillStyle = STONE; wc.beginPath(); wc.arc(F.x, F.z, 1.15, 0, TAU); wc.fill(); wc.stroke();
        wc.fillStyle = '#9fdcf2'; wc.beginPath(); wc.arc(F.x, F.z, 0.7, 0, TAU); wc.fill();
      }
      if (WL.bridge) { const b = WL.bridge, h = (b.len || 8) / 2; decks.push([b.x - b.ux * h, b.z - b.uz * h, b.x + b.ux * h, b.z + b.uz * h, b.w || 3]); }
      // the fallen logs (one is the bridge over the stream to Noa's glade)
      for (const l of W.logs || []) {
        const pts = [[l.x1, l.z1], [l.x2, l.z2]];
        wc.strokeStyle = INK; wc.lineWidth = l.r * 2 + 2.4 * PX; line(pts); wc.stroke();
        wc.strokeStyle = '#a8784e'; wc.lineWidth = l.r * 2; line(pts); wc.stroke();
        wc.strokeStyle = 'rgba(255,240,210,0.35)'; wc.lineWidth = l.r * 0.6; line(pts); wc.stroke();
      }
      // stepping stones where the forest path crosses the stream (as world3d.js lays them)
      if (typeof streamZ === 'function') {
        for (const [dx, dz] of [[1.6, -0.8], [3.0, 0.6], [4.4, -0.4], [2.2, 1.9]]) {
          const x = 0.2 + dx, z = streamZ(x) + dz;
          wc.fillStyle = '#b4afa2'; wc.strokeStyle = INK; wc.lineWidth = 1.1 * PX; wc.beginPath(); wc.ellipse(x, z, 0.62, 0.55, 0, 0, TAU); wc.fill(); wc.stroke();
        }
      }
      // the Reed River crossing (the bridge is broken in the middle) and Remanso's boardwalks, docks and landing (lake.js)
      const KL = lakeL();
      if (KL) {
        const BR = KL.bridge;
        if (BR) decks.push([BR.x - BR.half, BR.z, BR.x - BR.gap, BR.z, BR.w], [BR.x + BR.gap, BR.z, BR.x + BR.half, BR.z, BR.w]);
        if (KL.docks) for (const d of [KL.docks.east, KL.docks.west]) if (d) decks.push([d.x0, d.z, d.x1, d.z, d.w]);
        for (const p of KL.piers || []) decks.push([p.a[0], p.a[1], p.b[0], p.b[1], p.w]);
        const FD = KL.ferryDock; if (FD) { const zm = (FD.z0 + FD.z1) / 2; decks.push([FD.x0, zm, FD.x1, zm, Math.abs(FD.z1 - FD.z0)]); }
        const J = KL.jetty; if (J) decks.push([J.a[0], J.a[1], J.b[0], J.b[1], J.w]);
      }
      // (in passes: shadows, ink edges, boards, then the gaps between boards, so walks that meet join up)
      const each = fn => { for (const [ax, az, bx, bz, w] of decks) { const l = Math.hypot(bx - ax, bz - az); if (l < 1e-3) continue; wc.save(); wc.translate(ax, az); wc.rotate(Math.atan2(bz - az, bx - ax)); fn(l, w); wc.restore(); } };
      wc.fillStyle = 'rgba(25,16,40,0.22)'; each((l, w) => wc.fillRect(0.3, -w / 2 + 0.4, l, w));
      wc.fillStyle = INK; each((l, w) => wc.fillRect(-INKW, -w / 2 - INKW, l + INKW * 2, w + INKW * 2));
      wc.fillStyle = WOOD; each((l, w) => wc.fillRect(0, -w / 2, l, w));
      wc.strokeStyle = WOOD_D; wc.lineWidth = 0.9 * PX; each((l, w) => { wc.beginPath(); for (let s = 1.1; s < l - 0.2; s += 1.1) { wc.moveTo(s, -w / 2); wc.lineTo(s, w / 2); } wc.stroke(); });
    });

    // ---- the fox's den, in its clearing
    safe('den', () => {
      const den = W.den; if (!den) return;
      wc.fillStyle = '#6f9a4a'; wc.strokeStyle = 'rgba(43,34,53,0.7)'; wc.lineWidth = 1.2 * PX; wc.beginPath(); wc.arc(den.x, den.z, 1.7, 0, TAU); wc.fill(); wc.stroke();
      wc.fillStyle = '#2b2235'; wc.beginPath(); wc.ellipse(den.x + 0.6, den.z + 0.7, 0.55, 0.4, 0.6, 0, TAU); wc.fill();
      if (den.stump) { const s = den.stump; wc.fillStyle = '#a8784e'; wc.beginPath(); wc.arc(s.x, s.z, s.r, 0, TAU); wc.fill(); wc.stroke(); wc.strokeStyle = '#c99a68'; wc.beginPath(); wc.arc(s.x, s.z, s.r * 0.55, 0, TAU); wc.stroke(); }
      wc.fillStyle = '#b4afa2'; for (const [x, z] of den.stones || []) { wc.beginPath(); wc.arc(x, z, 0.45, 0, TAU); wc.fill(); }
    });


    // ---- roofs (from above, with the door's side lighter), stalls, windmills, the Great Mill, the lighthouse
    safe('buildings', () => {
      const roofs = [], mills = [], towers = [], awnings = [], clocks = [];
      const TL = townL(), ML = molL(), KL = lakeL();
      if (TL) {
        for (const b of TL.buildings || []) {
          if (b.kind === 'tower') towers.push({ x: b.x, z: b.z, w: b.w || 3.6 });
          else roofs.push({ x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot || 0, color: isHex(b.roof) ? b.roof : '#c9553f' });
        }
        for (const s of TL.stalls || []) awnings.push({ ...s, c1: s.awn ? s.awn[0] : '#d0663f', c2: s.awn ? s.awn[1] : '#fff4e4' });
      }
      if (ML) {
        (ML.buildings || []).forEach((b, i) => {
          if (b.kind === 'millhouse') { mills.push({ x: b.x, z: b.z, r: 2.0, arm: 4.0 }); return; }
          const color = b.kind === 'barn' ? '#b8483a' : ROOFS_M[(i * 5 + 3) % ROOFS_M.length];
          roofs.push({ x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot || 0, color });
          if (b.kind === 'clock') clocks.push(b);
        });
        for (const m of ML.mills || []) mills.push({ x: m.x, z: m.z, r: m.r, arm: m.r * 1.9 });
        for (const s of ML.stalls || []) awnings.push({ ...s, c1: AWN_M[s.id] || '#d0663f', c2: s.id === 'gray' ? '#d6d4d0' : '#fff4e4' });
      }
      if (KL) for (const b of KL.buildings || []) roofs.push({ x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot || 0, color: ROOF_LAKE[b.id] || (b.kind === 'stilt' ? THATCH : SLATE) });
      const SH = WL.stationHouse;
      if (SH) roofs.push({ x: SH.x, z: SH.z, w: SH.w, d: SH.d, rot: 0, color: '#9c3b30', door: SH.w / 2 - 1.5 });
      // shadows first (so none lands on a neighbour's roof)
      wc.fillStyle = 'rgba(25,16,40,0.28)';
      for (const b of roofs) { wc.beginPath(); obb({ x: b.x + 0.35, z: b.z + 0.45, hw: b.w / 2, hd: b.d / 2, rot: b.rot }); wc.fill(); }
      for (const t of towers) wc.fillRect(t.x - t.w / 2 + 0.35, t.z - t.w / 2 + 0.45, t.w, t.w);
      for (const m of mills) { wc.beginPath(); wc.arc(m.x + 0.3, m.z + 0.4, m.r, 0, TAU); wc.fill(); }
      // the roofs: the back darker, the front (the door's side) lighter, an ink edge and the ridge; a little door
      for (const b of roofs) {
        const hw = b.w / 2, hd = b.d / 2;
        wc.save(); wc.translate(b.x, b.z); wc.rotate(-(b.rot || 0));
        wc.fillStyle = tint(b.color, -0.25); wc.fillRect(-hw, -hd, b.w, hd);
        wc.fillStyle = b.color; wc.fillRect(-hw, 0, b.w, hd);
        wc.strokeStyle = INK; wc.lineWidth = 1.4 * PX; wc.strokeRect(-hw, -hd, b.w, b.d);
        wc.beginPath(); wc.moveTo(-hw, 0); wc.lineTo(hw, 0); wc.stroke();
        const dx = b.door != null ? b.door : 0;
        wc.fillStyle = '#5a3a24'; wc.fillRect(dx - 0.5, hd - 0.1, 1.0, 0.5);
        wc.restore();
      }
      // the bell tower: a little pyramid roof with the bell in the middle
      for (const t of towers) {
        const h = t.w / 2, x = t.x, z = t.z;
        const tri = (ax, az, bx, bz, col) => { wc.fillStyle = col; wc.beginPath(); wc.moveTo(x, z); wc.lineTo(ax, az); wc.lineTo(bx, bz); wc.closePath(); wc.fill(); };
        tri(x - h, z - h, x + h, z - h, '#8d82a2'); tri(x - h, z - h, x - h, z + h, '#a39ab5'); tri(x + h, z - h, x + h, z + h, '#6a6082'); tri(x - h, z + h, x + h, z + h, '#776d8e');
        wc.strokeStyle = INK; wc.lineWidth = 1.4 * PX; wc.strokeRect(x - h, z - h, t.w, t.w);
        wc.beginPath(); wc.moveTo(x - h, z - h); wc.lineTo(x + h, z + h); wc.moveTo(x + h, z - h); wc.lineTo(x - h, z + h); wc.stroke();
        wc.fillStyle = '#ffd23f'; wc.beginPath(); wc.arc(x, z, 0.5, 0, TAU); wc.fill(); wc.stroke();
      }
      // the market stalls' striped awnings
      for (const s of awnings) {
        const hw = (s.w || 3) / 2, hd = (s.d || 1.4) / 2, n = 6;
        wc.save(); wc.translate(s.x, s.z); wc.rotate(-(s.rot || 0));
        for (let i = 0; i < n; i++) { wc.fillStyle = i % 2 ? s.c2 : s.c1; wc.fillRect(-hw + i * hw * 2 / n, -hd, hw * 2 / n + 0.02, hd * 2); }
        wc.strokeStyle = INK; wc.lineWidth = 1.2 * PX; wc.strokeRect(-hw, -hd, hw * 2, hd * 2);
        wc.restore();
      }
      // Ciro's shop: a clock face on the roof
      for (const b of clocks) {
        wc.fillStyle = '#fdf8ee'; wc.strokeStyle = INK; wc.lineWidth = 1.3 * PX; wc.beginPath(); wc.arc(b.x, b.z, 1.25, 0, TAU); wc.fill(); wc.stroke();
        wc.lineWidth = 0.18; wc.beginPath(); wc.moveTo(b.x, b.z); wc.lineTo(b.x, b.z - 0.85); wc.moveTo(b.x, b.z); wc.lineTo(b.x + 0.6, b.z + 0.2); wc.stroke();
      }
      // windmills: four sails round a white tower with a brown cap
      const windmill = (x, z, r, arm, a0) => {
        for (let i = 0; i < 4; i++) {
          const a = a0 + i * Math.PI / 2, ux = Math.cos(a), uz = Math.sin(a), nx = -uz, nz = ux;
          wc.fillStyle = '#f6efdc'; wc.strokeStyle = INK; wc.lineWidth = 1 * PX; wc.beginPath();
          wc.moveTo(x + ux * arm * 0.3, z + uz * arm * 0.3); wc.lineTo(x + ux * arm, z + uz * arm);
          wc.lineTo(x + ux * arm + nx * arm * 0.24, z + uz * arm + nz * arm * 0.24); wc.lineTo(x + ux * arm * 0.3 + nx * arm * 0.24, z + uz * arm * 0.3 + nz * arm * 0.24);
          wc.closePath(); wc.fill(); wc.stroke();
          wc.strokeStyle = '#7a5236'; wc.lineWidth = Math.max(0.3, arm * 0.07); wc.beginPath(); wc.moveTo(x, z); wc.lineTo(x + ux * arm, z + uz * arm); wc.stroke();
        }
        wc.fillStyle = '#f3e6c8'; wc.strokeStyle = INK; wc.lineWidth = 1.4 * PX; wc.beginPath(); wc.arc(x, z, r, 0, TAU); wc.fill(); wc.stroke();
        wc.fillStyle = '#a8673a'; wc.beginPath(); wc.arc(x, z, r * 0.5, 0, TAU); wc.fill(); wc.stroke();
      };
      mills.forEach((m, i) => windmill(m.x, m.z, m.r, m.arm, 0.45 + i * 0.37));
      // the Great Mill on its stone plinth (gray and still until it's freed: the Hush patch over it does that)
      const gm = ML && ML.greatMill;
      if (gm) {
        const h = gm.half || 7.8;
        wc.fillStyle = 'rgba(25,16,40,0.28)'; wc.fillRect(gm.x - h + 0.45, gm.z - h + 0.6, h * 2, h * 2);
        wc.fillStyle = STONE; wc.strokeStyle = INK; wc.lineWidth = 1.6 * PX; wc.beginPath(); wc.rect(gm.x - h, gm.z - h, h * 2, h * 2); wc.fill(); wc.stroke();
        wc.strokeStyle = 'rgba(120,108,88,0.5)'; wc.lineWidth = 0.9 * PX; wc.strokeRect(gm.x - h + 1.2, gm.z - h + 1.2, h * 2 - 2.4, h * 2 - 2.4);
        windmill(gm.x, gm.z, 5.0, 10.5, 0.62);
        wc.fillStyle = '#8a5a3a'; wc.strokeStyle = INK; wc.lineWidth = 1.4 * PX; wc.beginPath(); wc.arc(gm.x, gm.z, 2.7, 0, TAU); wc.fill(); wc.stroke();
      }
      // Molinar's well in the middle of its square
      const sq = ML && ML.square;
      if (sq) { wc.fillStyle = STONE; wc.strokeStyle = INK; wc.lineWidth = 1.3 * PX; wc.beginPath(); wc.arc(sq.x, sq.z, 1.3, 0, TAU); wc.fill(); wc.stroke(); wc.fillStyle = '#3d6f8a'; wc.beginPath(); wc.arc(sq.x, sq.z, 0.75, 0, TAU); wc.fill(); }
      // the island's old lighthouse, and the lake's bell on its buoy
      const LM = typeof LAKE !== 'undefined' && LAKE.landmarks;
      if (LM && LM.lighthouse) {
        const { x, z } = LM.lighthouse;
        wc.fillStyle = 'rgba(25,16,40,0.28)'; wc.beginPath(); wc.arc(x + 0.35, z + 0.45, 2.0, 0, TAU); wc.fill();
        wc.fillStyle = '#b4ad9c'; wc.strokeStyle = INK; wc.lineWidth = 1.4 * PX; wc.beginPath(); wc.arc(x, z, 2.0, 0, TAU); wc.fill(); wc.stroke();
        wc.fillStyle = '#f1ece0'; wc.beginPath(); wc.arc(x, z, 1.45, 0, TAU); wc.fill(); wc.stroke();
        wc.fillStyle = '#c4574a'; wc.beginPath(); wc.arc(x, z, 0.95, 0, TAU); wc.fill(); wc.stroke();
        wc.fillStyle = '#ffe17a'; wc.beginPath(); wc.arc(x, z, 0.42, 0, TAU); wc.fill();
      }
      const buoy = KL && KL.buoy;
      if (buoy) { wc.fillStyle = '#e6b84a'; wc.strokeStyle = INK; wc.lineWidth = 1.3 * PX; wc.beginPath(); wc.arc(buoy.x, buoy.z, 0.85, 0, TAU); wc.fill(); wc.stroke(); }
    });

    safe('north', () => { if (typeof CEMETERY !== 'undefined' && CEMETERY.drawMap) CEMETERY.drawMap(wc, { PX, INK }); });     // (cemetery.js: brick roads, roofs, the cemetery)
    safe('caves', () => { if (typeof CAVES !== 'undefined' && CAVES.drawMap) CAVES.drawMap(wc, { PX, INK }); });     // (caves.js: the quarry road, the miners' camp, the mine's mouth)
    safe('peaks', () => { if (typeof PEAKS !== 'undefined' && PEAKS.drawMap) PEAKS.drawMap(wc, { PX, INK }); });     // (peaks.js: the snow, the Frost Pass, Escarcha's roofs, the Ice Clock Tower)
    safe('port', () => { if (typeof PORT !== 'undefined' && PORT.drawMap) PORT.drawMap(wc, { PX, INK }); });     // (port.js: the Brisa Road, the walled city, the piers, the moat, the sea fort)
    safe('marsh', () => { if (typeof MARSH !== 'undefined' && MARSH.drawMap) MARSH.drawMap(wc, { PX, INK }); });     // (marsh.js: the road in, the boardwalk, Candil's roofs, the causeway, the chapel)
    safe('ruins', () => { if (typeof RUINS !== 'undefined' && RUINS.drawMap) RUINS.drawMap(wc, { PX, INK }); });     // (ruins.js: the canyon's rock and sand, the cove, the pier and the ship, the camp, the temple)
    safe('gardens', () => { if (typeof GARDENS !== 'undefined' && GARDENS.drawMap) GARDENS.drawMap(wc, { PX, INK }); });     // (gardens.js: the hedge, the flower fields, the marquee, the glasshouses)
    // 6. the Hush: gray patches (MAP channel 2). Each patch keeps the colors from under it, so it can lift again.
    const hush = [];
    safe('hush', () => {
      for (let i = 0; i < WL.hush.length; i++) {
        const h = WL.hush[i];
        const x0 = clamp(Math.floor((h.x - h.r - 1 - X0) * K), 0, CW), y0 = clamp(Math.floor((h.z - h.r - 1 - Z0) * K), 0, CH);
        const x1 = clamp(Math.ceil((h.x + h.r + 1 - X0) * K), 0, CW), y1 = clamp(Math.ceil((h.z + h.r + 1 - Z0) * K), 0, CH);
        if (x1 - x0 < 1 || y1 - y0 < 1) continue;
        hush.push({ i, x0, y0, w: x1 - x0, h: y1 - y0, snap: wc.getImageData(x0, y0, x1 - x0, y1 - y0), a: -1, t: -9 });
      }
      const out = { X0, Z0 };
      for (const p of hush) paintHush(p, wc, out);
    });

    // 7. onto the picture the card reads from (it stays on the graphics card: drawn every frame, never read back)
    const pic = document.createElement('canvas'); pic.width = CW; pic.height = CH;
    pic.getContext('2d').drawImage(work, 0, 0);
    work.width = work.height = 1;
    lap('copy');
    timing.build = +(performance.now() - t0).toFixed(1); timing.parts = parts; timing.errors = errors;
    return { cv: pic, ctx: pic.getContext('2d'), X0, Z0, W: CW, H: CH, hush };
  }

  // A gray patch, painted from the colors under it: the more Hush there (MAP channel 2), the grayer.
  function paintHush(p, target, at) {
    const W = WORLD, WL = W.L, GW = W.GW, GH = W.GH, MAPC = W.MAP, h = WL.hush[p.i];
    const out = new ImageData(p.w, p.h), s = p.snap.data, d = out.data, X0 = at.X0, Z0 = at.Z0;
    for (let y = 0; y < p.h; y++) {
      const fz = clamp(Z0 + (p.y0 + y + 0.5) / K - WL.minZ, 0, GH - 1.001), j = fz | 0, v = fz - j;
      for (let x = 0; x < p.w; x++) {
        const o = (y * p.w + x) * 4;
        const fx = clamp(X0 + (p.x0 + x + 0.5) / K - WL.minX, 0, GW - 1.001), i = fx | 0, u = fx - i, k = (j * GW + i) * 4 + 2;
        const hv = (MAPC[k] * (1 - u) + MAPC[k + 4] * u) * (1 - v) + (MAPC[k + GW * 4] * (1 - u) + MAPC[k + GW * 4 + 4] * u) * v;
        const r = s[o], g = s[o + 1], b = s[o + 2];
        if (hv < 0.005) { d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; continue; }
        const q = Math.min(1, hv * 1.3) * 0.9, lum = 0.3 * r + 0.59 * g + 0.11 * b;
        d[o] = r + (lum * 0.78 + 36 - r) * q; d[o + 1] = g + (lum * 0.78 + 34 - g) * q; d[o + 2] = b + (lum * 0.78 + 48 - b) * q; d[o + 3] = 255;
      }
    }
    target.putImageData(out, p.x0, p.y0);
    p.a = h ? h.a : 0;
  }
  // When a patch lifts (w3d.liftHush lowers its strength and rewrites MAP), paint it again, a few times a second.
  function checkHush() {
    if (!land || !land.hush) return;
    for (const p of land.hush) {
      const h = WORLD.L.hush[p.i]; if (!h) continue;
      if (h.a !== p.a && T - p.t > 0.2) { p.t = T; try { paintHush(p, land.ctx, land); } catch (e) { warnOnce('hush', e); } }
    }
  }

  // ---------------------------------------------------------------- markers
  // You: a round badge with your face (hair, scarf), a pointer the way you face, and a ring that pulses out.
  function youBadge(c, x, y, ang, t, dpr) {
    const q = (t * 0.9) % 1;
    c.strokeStyle = `rgba(255,107,107,${(0.8 * (1 - q)).toFixed(2)})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 9 + q * 9, 0, TAU); c.stroke();
    const ca = Math.cos(ang), sa = Math.sin(ang), at = (u, v) => [x + u * ca - v * sa, y + u * sa + v * ca];
    const [ax, ay] = at(16.5, 0), [bx, by] = at(5.5, -6.8), [ex, ey] = at(5.5, 6.8);
    c.fillStyle = '#ff6b6b'; c.strokeStyle = INK; c.lineWidth = 1.7; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.lineTo(ex, ey); c.closePath(); c.fill(); c.stroke();
    c.drawImage(badgeSprite(dpr), x - 11, y - 11, 22, 22);
  }
  // A map pin on the goal: gold for the main quest, teal for a side quest, with a star in its head.
  function pin(c, x, y, t, side, big, here, dpr) {
    const s = big ? 1 : 0.78, b = Math.sin(t * (here ? 7 : 4)) * (here ? 2.6 : 1.4);
    c.fillStyle = 'rgba(30,20,45,0.35)'; c.beginPath(); c.ellipse(x, y + 1, 4 * s, 1.8 * s, 0, 0, TAU); c.fill();
    if (big) c.drawImage(glowSprite(dpr, side), x - 15, y - 11 * s + b - 15, 30, 30);
    c.drawImage(pinSprite(dpr, side), x - 11 * s, y + b - 20.5 * s, 22 * s, 22 * s);
  }
  // When the goal is off the card: an arrow on the rim pointing at it.
  function rimArrow(c, fx, fy, tx, ty, t, side, big) {
    const dx = tx - fx, dy = ty - fy, a = Math.atan2(dy, dx), [rx, ry] = rimPoint(fx, fy, dx, dy, big ? 13 : 11);
    const bob = 1.2 + Math.sin(t * 5) * 1.2, x = rx + Math.cos(a) * bob, y = ry + Math.sin(a) * bob, s = big ? 1 : 0.75;
    c.save(); c.globalAlpha = big ? 1 : 0.85; c.translate(x, y); c.rotate(a); c.scale(s, s);
    c.fillStyle = side ? '#3fd0bd' : '#ffd23f'; c.strokeStyle = INK; c.lineWidth = 1.8; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(10, 0); c.lineTo(-4, -8); c.lineTo(-1, 0); c.lineTo(-4, 8); c.closePath(); c.fill(); c.stroke();
    c.restore();
    if (big) {
      const sx = x - Math.cos(a) * 12, sy = y - Math.sin(a) * 12;
      c.fillStyle = side ? '#3fd0bd' : '#ffe066'; c.strokeStyle = INK; c.lineWidth = 1.4;
      c.beginPath(); if (side) { c.moveTo(sx, sy - 5); c.lineTo(sx + 4, sy); c.lineTo(sx, sy + 5); c.lineTo(sx - 4, sy); c.closePath(); } else starPath(c, sx, sy, 5.4, 2.4); c.fill(); c.stroke();
    }
  }
  // Little pictures drawn once (at the card's pixel ratio) and stamped each frame: the N badge, the pins' glows.
  const SPR = {};
  function sprite(key, size, dpr, paint) {
    const k = key + '@' + dpr;
    if (!SPR[k]) {
      const cvS = document.createElement('canvas'); cvS.width = cvS.height = Math.ceil(size * dpr);
      const c = cvS.getContext('2d'); c.scale(dpr, dpr); paint(c, size / 2); SPR[k] = cvS;
    }
    return SPR[k];
  }
  const nBadge = dpr => sprite('n', 18, dpr, (c, m) => {
    c.fillStyle = PAPER; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(m, m, 7, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#c2412f'; c.font = '900 10px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', m, m + 0.6);
  });
  const glowSprite = (dpr, side) => sprite(side ? 'glowS' : 'glowM', 30, dpr, (c, m) => glow(c, m, m, 14, side ? '120,230,215' : '255,224,102', 0.55));
  // a dot with an ink edge and a colored middle (townsfolk), or a shine (Mimo)
  const DOTS = {
    folk: [2.9, PAPER, 1.2, '#9a82e0'], hushed: [2.8, '#c4c2cc', 1.2, '#86839a'], story: [3.5, PAPER, 1.3, '#3f7fc9'], mimo: [3.8, '#2fd0c2', 1.5, null],
  };
  const dotOf = (dpr, kind) => sprite('dot-' + kind, Math.ceil(DOTS[kind][0] * 2 + 4), dpr, (c, m) => {
    const [r, fill, edge, center] = DOTS[kind];
    c.fillStyle = fill; c.strokeStyle = INK; c.lineWidth = edge; c.beginPath(); c.arc(m, m, r, 0, TAU); c.fill(); c.stroke();
    if (center) { c.fillStyle = center; c.beginPath(); c.arc(m, m, r * 0.46, 0, TAU); c.fill(); }
    else { c.fillStyle = 'rgba(255,250,240,0.85)'; c.beginPath(); c.arc(m - r * 0.3, m - r * 0.3, r * 0.32, 0, TAU); c.fill(); }
  });
  const starSprite = (dpr, r, col) => sprite(`star${r}${col}`, Math.ceil(r * 2 + 4), dpr, (c, m) => { c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.3; c.lineJoin = 'round'; c.beginPath(); starPath(c, m, m, r, 2.6, 6); c.fill(); c.stroke(); });
  const ringSprite = dpr => sprite('ring', 8, dpr, (c, m) => { c.fillStyle = 'rgba(255,240,170,0.5)'; c.beginPath(); c.arc(m, m, 2.6, 0, TAU); c.fill(); c.fillStyle = '#fff8dc'; c.beginPath(); c.arc(m, m, 1.3, 0, TAU); c.fill(); });
  // a map pin (its tip at the bottom middle of the sprite): gold with a star, teal with a diamond
  const pinSprite = (dpr, side) => sprite(side ? 'pinS' : 'pinM', 22, dpr, (c, m) => {
    c.translate(m, 20.5);
    c.fillStyle = side ? '#3fd0bd' : '#ffd23f'; c.strokeStyle = INK; c.lineWidth = 1.8; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-2.5, -4, -7.5, -7, -7.5, -11.5); c.arc(0, -11.5, 7.5, Math.PI, 0);
    c.bezierCurveTo(7.5, -7, 2.5, -4, 0, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = PAPER; c.beginPath(); if (side) { c.moveTo(0, -16); c.lineTo(4, -11.5); c.lineTo(0, -7); c.lineTo(-4, -11.5); c.closePath(); } else starPath(c, 0, -11.5, 4.6, 2); c.fill();
  });
  // your badge: your face (hair, eyes, the teal scarf) in a coral ring
  const badgeSprite = dpr => sprite('you', 22, dpr, (c, m) => {
    const H = (typeof ACTORS !== 'undefined' && ACTORS.HERO) || { skin: '#f5cda2', hair: '#4a2f27', scarf: '#20a492' };
    c.fillStyle = '#ff6b6b'; c.beginPath(); c.arc(m, m, 9.2, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(m, m, 7.3, 0, TAU); c.clip();
    c.fillStyle = '#ffe9b8'; c.fillRect(m - 8, m - 8, 16, 16);
    c.fillStyle = H.skin; c.beginPath(); c.arc(m, m + 1.4, 5.1, 0, TAU); c.fill();
    c.fillStyle = H.hair; c.beginPath(); c.arc(m, m + 0.4, 5.5, Math.PI * 1.04, Math.PI * 1.96); c.closePath(); c.fill();
    c.fillStyle = H.scarf; c.fillRect(m - 8, m + 5.6, 16, 3);
    c.fillStyle = INK; c.beginPath(); c.arc(m - 1.9, m + 1.9, 0.8, 0, TAU); c.arc(m + 1.9, m + 1.9, 0.8, 0, TAU); c.fill();
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.arc(m, m, 9.2, 0, TAU); c.stroke();
  });
  const doorSprite = (dpr, locked) => sprite(locked ? 'doorL' : 'door', 16, dpr, (c, m) => doorIcon(c, m, m, locked));
  function doorIcon(c, x, y, locked) {
    c.fillStyle = PAPER; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 6.2, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = locked ? '#8a7f70' : '#a8673a'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x - 3, y + 3.6); c.lineTo(x - 3, y - 0.6); c.arc(x, y - 0.6, 3, Math.PI, 0); c.lineTo(x + 3, y + 3.6); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x + 1.3, y + 1.1, 0.75, 0, TAU); c.fill();
  }
  // The doors and ways in: the Great Mill's door, and INTERIORS' doors (once it exists). Checked twice a second.
  function doorsNow() {
    if (T - doorsT < 0.5) return doors;
    doorsT = T;
    const out = [], ml = G.molinar && G.molinar.landmarks, md = (ml && ml.millDoor) || (typeof MOLINAR !== 'undefined' && MOLINAR.landmarks && MOLINAR.landmarks.millDoor);
    if (md) out.push({ x: md.x, z: md.z });
    if (typeof INTERIORS !== 'undefined' && INTERIORS && typeof INTERIORS.doors === 'function') {
      try { for (const d of INTERIORS.doors(G) || []) if (d && isFinite(d.x) && isFinite(d.z)) out.push(d); } catch (e) { warnOnce('INTERIORS.doors', e); }
    }
    return (doors = out);
  }

  // a room with a map of its own (Meridiana, js/ch5/mer_city.js: each district's picture): room.ownMap() → { cv, X0, Z0, K, bg } or
  // null; room.mapMarks(dpr) → [{ x, z, img }]; room.mapDots() → [{ x, z, kind: 'folk' | 'story' | 'foe', alert }]
  const ownRoom = () => { const rm = G && typeof G.indoorMod === 'function' ? G.indoorMod() : null; return rm && typeof rm.ownMap === 'function' && rm.ownMap() ? rm : null; };
  function drawOwn(c, O, rm, v) {
    const { vx, vz, yaw, th, cs, sn, t, dpr, Y, M } = v, K0 = O.K || K;
    c.fillStyle = O.bg || '#e9dcc4'; c.fillRect(0, 0, MW, MH);
    c.save(); c.translate(OX, OY); c.rotate(th); c.scale(SCALE / K0, SCALE / K0); c.translate(-(vx - O.X0) * K0, -(vz - O.Z0) * K0); c.drawImage(O.cv, 0, 0); c.restore();
    const P = (x, z) => { const dx = x - vx, dz = z - vz; return [OX + (dx * cs - dz * sn) * SCALE, OY + (dx * sn + dz * cs) * SCALE]; };
    const onCard = (x, y, m = 4) => x > -m && x < MW + m && y > -m && y < MH + m;
    const put = (img, x, y) => { const s = img.width / dpr; c.drawImage(img, x - s / 2, y - s / 2, s, s); };
    try { for (const m of rm.mapMarks ? rm.mapMarks(dpr) || [] : []) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('own marks', e); }
    try {
      const q = (t * 2.2) % 1;
      for (const d of rm.mapDots ? rm.mapDots() || [] : []) {
        const [x, y] = P(d.x, d.z); if (!onCard(x, y, 8)) continue;
        if (d.kind === 'foe') { if (d.alert) { c.strokeStyle = `rgba(229,83,75,${(1 - q).toFixed(2)})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5 + q * 9, 0, TAU); c.stroke(); } put(starSprite(dpr, d.alert ? 5.6 : 4.6, d.alert ? '#ff4d4d' : '#e5534b'), x, y); }
        else put(dotOf(dpr, d.kind === 'story' ? 'story' : 'folk'), x, y);
      }
    } catch (e) { warnOnce('own dots', e); }
    let marks = []; try { if (typeof QUESTS !== 'undefined' && QUESTS.marks) marks = QUESTS.marks() || []; } catch (e) { warnOnce('QUESTS.marks', e); }
    const [yx, yy] = P(Y.x, Y.z), off = [];
    for (let i = marks.length - 1; i >= 0; i--) {
      const m = marks[i]; if (!m || !isFinite(m.x) || !isFinite(m.z)) continue;
      const [x, y] = P(m.x, m.z), big = i === 0 || !!m.tracked, side = m.kind === 'side';
      if (x > 6 && x < MW - 6 && y > 12 && y < MH - 3) pin(c, x, y, t, side, big, Math.hypot(m.x - Y.x, m.z - Y.z) < 4, dpr); else off.push([x, y, side, big]);
    }
    if (M && !M.hidden) { let [mx, my] = P(M.x, M.z); const dx = mx - yx, dy = my - yy, d = Math.hypot(dx, dy); if (d < 11.5 && d > 0.5) { mx = yx + dx / d * 11.5; my = yy + dy / d * 11.5; } put(dotOf(dpr, 'mimo'), mx, my); }
    youBadge(c, yx, yy, yaw - Y.yaw - Math.PI / 2, t, dpr);
    if (!topShade) { topShade = c.createLinearGradient(0, 0, 0, 10); topShade.addColorStop(0, 'rgba(20,12,36,0.34)'); topShade.addColorStop(1, 'rgba(20,12,36,0)'); }
    c.fillStyle = topShade; c.fillRect(0, 0, MW, 10);
    { const [nx, ny] = rimPoint(MW / 2, MH / 2, sn, -cs, 10.5); c.drawImage(nBadge(dpr), nx - 9, ny - 9, 18, 18); }
    for (const [x, y, side, big] of off) rimArrow(c, yx, yy, x, y, t, side, big);
  }

  function draw(dt) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), bw = Math.round(MW * dpr), bh = Math.round(MH * dpr);
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; topShade = null; bgPattern = null; }
    const c = ctx, sim = G.sim, Y = sim.you, M = sim.mimo, st = G.state, t = T;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // where the card looks: at you, gliding after you (a jump across the map snaps)
    if (!view || Math.abs(view.x - Y.x) + Math.abs(view.z - Y.z) > 30) view = { x: Y.x, z: Y.z };
    else { const k = 1 - Math.exp(-14 * dt); view.x += (Y.x - view.x) * k; view.z += (Y.z - view.z) * k; }
    const vx = view.x, vz = view.z, yaw = G.cam.yaw || 0, th = yaw - Math.PI, cs = Math.cos(th), sn = Math.sin(th);
    { const rm = ownRoom(), OWN = rm && rm.ownMap(); if (OWN) { drawOwn(c, OWN, rm, { vx, vz, yaw, th, cs, sn, t, dpr, Y, M }); return; } }
    // the land, turned so that up is where the camera looks (only the part the card can reach is drawn); past the
    // map's edge the woods carry on (the same canopy, lined up with the picture's)
    const L0 = land, lx = (vx - L0.X0) * K, lz = (vz - L0.Z0) * K, R = RV * K + 4;
    const sx = Math.max(0, Math.floor(lx - R)), sy = Math.max(0, Math.floor(lz - R)), ex = Math.min(L0.W, Math.ceil(lx + R)), ey = Math.min(L0.H, Math.ceil(lz + R));
    c.save(); c.translate(OX, OY); c.rotate(th); c.scale(SCALE / K, SCALE / K); c.translate(-lx, -lz);
    if (sx > lx - R || sy > lz - R || ex < lx + R || ey < lz + R) {
      if (!bgPattern) bgPattern = c.createPattern(canopyTile(), 'repeat');
      c.fillStyle = bgPattern || WOODS_CSS; c.fillRect(lx - R, lz - R, R * 2, R * 2);
    }
    if (ex > sx && ey > sy) c.drawImage(L0.cv, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
    // (another world's own land, time_land.js: painted once, in the picture's pixels, over it)
    if (typeof TIME !== 'undefined' && TIME.mapLand) { try { const LO = TIME.mapLand(); if (LO && LO.cv) c.drawImage(LO.cv, LO.px, LO.py, LO.w, LO.h); } catch (e) { warnOnce('TIME.mapLand', e); } }
    c.restore();
    const P = (x, z) => { const dx = x - vx, dz = z - vz; return [OX + (dx * cs - dz * sn) * SCALE, OY + (dx * sn + dz * cs) * SCALE]; };
    const near = (x, z, pad = 2) => Math.abs(x - vx) < RV + pad && Math.abs(z - vz) < RV + pad;
    const onCard = (x, y, m = 4) => x > -m && x < MW + m && y > -m && y < MH + m;

    // markers are little pictures drawn once and stamped (quick: the same picture again and again)
    const put = (img, x, y) => { const s = img.width / dpr; c.drawImage(img, x - s / 2, y - s / 2, s, s); };
    // the fairy ring's glowing mushrooms (until they're picked)
    const ring = WORLD.ring;
    if (ring && ring.length && near(ring[0].x, ring[0].z, 6)) {
      const picked = st.pickedRing || [], img = ringSprite(dpr);
      for (let i = 0; i < ring.length; i++) { if (!picked.includes(i)) { const [x, y] = P(ring[i].x, ring[i].z); put(img, x, y); } }
    }
    // the boulder in the pass (it moves when Mimo pushes it)
    if ((boulderT -= dt) <= 0) { boulderT = 5; boulder = (WORLD.extra || []).find(s => s.id === 'boulder') || null; }
    if (boulder && near(boulder.x, boulder.z)) {
      const [x, y] = P(boulder.x, boulder.z), r = (boulder.r || 2.1) * SCALE;
      c.fillStyle = 'rgba(30,20,45,0.3)'; c.beginPath(); c.arc(x + 1, y + 1.5, r, 0, TAU); c.fill();
      c.fillStyle = '#a19a8d'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#6f9a4a'; c.beginPath(); c.arc(x - r * 0.15, y - r * 0.2, r * 0.48, 0, TAU); c.fill();
    }
    // the raft on the Reed River and the ferry (lake.js moves them)
    const LO = G.lake && G.lake.objects;
    if (LO) {
      for (const [o, w, d, col] of [[LO.raft, 2.4, 2.4, '#b88a52'], [LO.ferry, 6.4, 3.2, '#a8784e']]) {
        if (!o || !o.position || !near(o.position.x, o.position.z)) continue;
        const [x, y] = P(o.position.x, o.position.z);
        c.save(); c.translate(x, y); c.rotate(th - (o.rotation ? o.rotation.y : 0));
        c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.rect(-w * SCALE / 2, -d * SCALE / 2, w * SCALE, d * SCALE); c.fill(); c.stroke();
        c.restore();
      }
    }
    // doors
    for (const d of doorsNow()) { if (!near(d.x, d.z)) continue; const [x, y] = P(d.x, d.z); if (onCard(x, y)) put(doorSprite(dpr, !!d.locked), x, y); }
    // the script school's door (school.js, zh / ja games): a red seal with 字 or あ
    if (typeof SCHOOL !== 'undefined' && SCHOOL.mapMark) {
      try { const m = SCHOOL.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('SCHOOL.mapMark', e); }
    }
    // Grandma Mei's restaurant (grandma.js, every language): a red lantern on its door
    if (typeof GRANDMA !== 'undefined' && GRANDMA.mapMark) {
      try { const m = GRANDMA.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('GRANDMA.mapMark', e); }
    }
    // Otoha and Susumu's house (anime.js, ja games): a pink ♪ on its door
    if (typeof ANIME !== 'undefined' && ANIME.mapMark) {
      try { const m = ANIME.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('ANIME.mapMark', e); }
    }
    // the village ofrenda (muertos.js, es games, once it's built): a marigold
    if (typeof MUERTOS !== 'undefined' && MUERTOS.mapMark) {
      try { const m = MUERTOS.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('MUERTOS.mapMark', e); }
    }
    // Doña Toña's tortilla stand (lucha.js, es games, once you've met her): a little gold bell
    if (typeof LUCHA !== 'undefined' && LUCHA.mapMark) {
      try { const m = LUCHA.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('LUCHA.mapMark', e); }
    }
    // Natsu, the summer-festival kid by the bell tower (matsuri.js, ja games): a blue badge with 祭
    if (typeof MATSURI !== 'undefined' && MATSURI.mapMark) {
      try { const m = MATSURI.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('MATSURI.mapMark', e); }
    }
    // Grandpa Shige's shogi bench at the game corner (shogi.js, ja games): a little shogi piece with 将
    if (typeof SHOGI !== 'undefined' && SHOGI.mapMark) {
      try { const m = SHOGI.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('SHOGI.mapMark', e); }
    }
    // Malu, the Carnaval kid by the bell tower (carnaval.js, pt games): a pink badge with a yellow star
    if (typeof CARNAVAL !== 'undefined' && CARNAVAL.mapMark) {
      try { const m = CARNAVAL.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('CARNAVAL.mapMark', e); }
    }
    // Vó Dita on her chair by her door (familia.js, pt games): a coral badge with a speech bubble
    if (typeof FAMILIA !== 'undefined' && FAMILIA.mapMark) {
      try { const m = FAMILIA.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('FAMILIA.mapMark', e); }
    }
    // Fiete's Weihnachtsmarkt around the fountain (weihnacht.js, de games): a little wooden stall, with lights once it's open
    if (typeof WEIHNACHT !== 'undefined' && WEIHNACHT.mapMark) {
      try { const m = WEIHNACHT.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('WEIHNACHT.mapMark', e); }
    }
    // the Yıldız Grill, the Dönerladen on the west street (doener.js, de games): a red square with a gold star (grey while the Hush has it)
    if (typeof DOENER !== 'undefined' && DOENER.mapMark) {
      try { const m = DOENER.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('DOENER.mapMark', e); }
    }
    // the Academy of Alba (js/exam/academy.js, every language with exams): its crest on the door
    if (typeof ACADEMY !== 'undefined' && ACADEMY.mapMark) {
      try { const m = ACADEMY.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('ACADEMY.mapMark', e); }
    }
    // the town hall and post office (js/life/townhall.js, every language with LIFE content): an envelope on a teal disc
    if (typeof TOWNHALL !== 'undefined' && TOWNHALL.mapMark) {
      try { const m = TOWNHALL.mapMark(dpr); if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('TOWNHALL.mapMark', e); }
    }
    // reading and listening (js/read/): the library's open book, the inn's radio, Noa's unread diary pages, pairs chatting
    if (typeof READ !== 'undefined' && READ.mapMarks) {
      try { for (const m of READ.mapMarks(dpr) || []) if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('READ.mapMarks', e); }
    }
    // the time cracks (time.js): a little tear in the colors of where each one leads
    const TW = typeof TIME !== 'undefined' && TIME.world ? TIME.world() : 'now';
    if (typeof TIME !== 'undefined' && TIME.mapMarks) {
      try { for (const m of TIME.mapMarks(dpr) || []) if (m && near(m.x, m.z)) { const [x, y] = P(m.x, m.z); if (onCard(x, y)) put(m.img, x, y); } } catch (e) { warnOnce('TIME.mapMarks', e); }
    }
    // townsfolk (gray when the Hush has them), then the story's people (blue)
    const folk = dotOf(dpr, 'folk'), hushed = dotOf(dpr, 'hushed'), story = dotOf(dpr, 'story');
    // (and the modules' people: town life, the kids and hustlers, the language's character; hidden ones are parked far off)
    // (in another world, time.js: not today's people, but that world's: the Old Quarter's of then, and the region's own)
    let TD = null; if (TW !== 'now') { try { TD = TIME.dots(); } catch (e) { warnOnce('TIME.dots', e); } }
    for (const list of TW !== 'now' ? [TW === 'past' && G.cemetery && G.cemetery.people, TD] : [G.town && G.town.people, G.molinar && G.molinar.people, G.lake && G.lake.people, G.townlife && G.townlife.people,
      G.minigames && G.minigames.people, G.domino && G.domino.people, G.phonk && G.phonk.people, G.adolf && G.adolf.people, G.cemetery && G.cemetery.people,
      G.romance && G.romance.people, G.caves && G.caves.people, G.peaks && G.peaks.people, G.cards && G.cards.people, G.newyear && G.newyear.people, G.muertos && G.muertos.people, G.weihnacht && G.weihnacht.people, G.lucha && G.lucha.people]) {
      if (!list) continue;
      for (const p of list) {
        if (p.hidden) continue;
        const px = p.x, pz = p.z;
        if (!near(px, pz)) continue;
        const [x, y] = P(px, pz);
        if (onCard(x, y)) put(p.hushed ? hushed : p.story ? story : folk, x, y);
      }
    }
    for (const n of sim.npcs || []) { if (!near(n.x, n.z)) continue; const [x, y] = P(n.x, n.z); if (onCard(x, y)) put(story, x, y); }
    // Hushlings: spiky red, and pulsing while one's after you
    if (typeof G.foeMarks === 'function') {
      let foes = null;
      try { foes = G.foeMarks(); } catch (e) { warnOnce('foeMarks', e); }
      const q = (t * 2.2) % 1, calm = starSprite(dpr, 4.6, '#e5534b'), mad = starSprite(dpr, 5.6, '#ff4d4d');
      for (const e of foes || []) {
        if (!e || !near(e.x, e.z)) continue;
        const [x, y] = P(e.x, e.z);
        if (!onCard(x, y, 8)) continue;
        const chase = typeof e.alert === 'number' ? e.alert > 0.5 : !!e.alert;
        if (chase) { c.strokeStyle = `rgba(229,83,75,${(1 - q).toFixed(2)})`; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 5 + q * 9, 0, TAU); c.stroke(); }
        put(chase ? mad : calm, x, y);
      }
    }
    // the quest goals: a pin when it's on the card (the arrows on the rim come last, over everything)
    let marks = [];
    if (st.flags && st.flags.hatched && typeof QUESTS !== 'undefined' && QUESTS.marks) { try { marks = QUESTS.marks() || []; } catch (e) { warnOnce('QUESTS.marks', e); } }
    const [yx, yy] = P(Y.x, Y.z), off = [];
    for (let i = marks.length - 1; i >= 0; i--) {         // (the tracked one is first: drawn last, on top)
      const m = marks[i]; if (!m || !isFinite(m.x) || !isFinite(m.z)) continue;
      const [x, y] = P(m.x, m.z), big = i === 0 || !!m.tracked, side = m.kind === 'side';
      if (x > 6 && x < MW - 6 && y > 12 && y < MH - 3) pin(c, x, y, t, side, big, Math.hypot(m.x - Y.x, m.z - Y.z) < 4, dpr);
      else off.push([x, y, side, big]);
    }
    // Mimo: a small teal dot (kept just clear of your badge, where it's usually tucked in behind you)
    if (M && !M.hidden) {
      let [mx, my] = P(M.x, M.z);
      let dx = mx - yx, dy = my - yy, d = Math.hypot(dx, dy);
      if (d < 11.5) { if (d < 0.5) { dx = -Math.cos(yaw - Y.yaw - Math.PI / 2); dy = -Math.sin(yaw - Y.yaw - Math.PI / 2); d = 1; } mx = yx + (dx / d) * 11.5; my = yy + (dy / d) * 11.5; }
      put(dotOf(dpr, 'mimo'), mx, my);
    }
    // you
    youBadge(c, yx, yy, yaw - Y.yaw - Math.PI / 2, t, dpr);
    // a soft shade along the top, the N on the rim, and the arrows to goals off the card
    if (!topShade) { topShade = c.createLinearGradient(0, 0, 0, 10); topShade.addColorStop(0, 'rgba(20,12,36,0.34)'); topShade.addColorStop(1, 'rgba(20,12,36,0)'); }
    c.fillStyle = topShade; c.fillRect(0, 0, MW, 10);
    { const [nx, ny] = rimPoint(MW / 2, MH / 2, sn, -cs, 10.5); c.drawImage(nBadge(dpr), nx - 9, ny - 9, 18, 18); }
    for (const [x, y, side, big] of off) rimArrow(c, yx, yy, x, y, t, side, big);       // (the tracked one last, on top)
  }

  // ---------------------------------------------------------------- every frame
  function update(dt) {
    if (!G || !root) return;
    const st = G.state; if (!st) return;
    if (st.time === lastTime) return;                     // (once a frame, however many times it's called)
    lastTime = st.time;
    const t0 = performance.now();
    dt = Math.min(0.1, Math.max(0, dt || 0));
    T += dt;
    const f = st.flags || {};
    // indoors (main.js game.indoors(): the Great Mill, a house, the Corn Society's hall), or any of those modules saying so
    // (the Past and the Future are Alba itself, outdoors: its map shows; so is any world time.js dresses. A dungeon or a room inside one of
    // those worlds comes first in main.js's ROOMS, so indoorMod() names it, and the map hides there like in any other room.)
    const room = typeof G.indoorMod === 'function' ? G.indoorMod() : null;
    const isWorld = m => (typeof PAST !== 'undefined' && m === PAST) || (typeof FUTURE !== 'undefined' && m === FUTURE) || (typeof TIME !== 'undefined' && m === TIME) || !!(m && m.ownMap && m.ownMap());     // (a room with a map of its own: Meridiana)
    const inside = (!!room && !isWorld(room)) || (typeof MILL !== 'undefined' && !!MILL.inside)
      || (typeof INTERIORS !== 'undefined' && !!(INTERIORS && INTERIORS.inside)) || (typeof CORN !== 'undefined' && !!(CORN && CORN.inside));
    const setting = typeof KEYS === 'undefined' || !KEYS.opts || KEYS.opts.minimap !== false;     // (Settings: "Mini-map")
    const want = visible && setting && !!land && !!f.hatched && !inside;
    setBody(want);
    const show = want && !G.cam.override && !st.teaching && !G.journalOpen;
    setCard(show);
    checkHush();
    if (show) {
      try {
        if ((areaT -= dt) <= 0) {
          areaT = 0.25;
          const a = areaAt(G.sim.you.x, G.sim.you.z);
          if (a !== area) { area = a; tabEl.textContent = a.name; tabEl.style.backgroundColor = a.color; }
        }
        draw(dt);
      } catch (e) { warnOnce('draw', e); }
      const ms = performance.now() - t0;
      timing.ms[timing.i] = ms; timing.i = (timing.i + 1) % timing.ms.length; timing.n = Math.min(timing.n + 1, timing.ms.length);
      timing.max = Math.max(timing.max, ms); timing.last = ms;
    }
  }

  function init(game) {
    if (G) return;
    G = game;
    try { addCSS(); addCard(); } catch (e) { console.error('[minimap]', e); G = null; return; }
    rebuild();
  }
  function rebuild() {
    if (typeof WORLD === 'undefined') return;
    try { land = drawLand(); } catch (e) { console.error('[minimap] drawing the land', e); }
    view = null;
  }
  function stats() {
    const n = timing.n, a = Array.from(timing.ms.slice(0, n)).sort((p, q) => p - q);
    return {
      ready: !!land, build: timing.build, parts: timing.parts, errors: timing.errors || [], land: land ? [land.W, land.H] : null, trees: timing.trees || 0,
      frames: n, avg: n ? +(a.reduce((s, v) => s + v, 0) / n).toFixed(3) : 0, p95: n ? +a[Math.floor(n * 0.95)].toFixed(3) : 0, max: +timing.max.toFixed(3), last: +timing.last.toFixed(3),
      dpr: Math.min(2, window.devicePixelRatio || 1), shown: !!cardOn, area: area ? area.name : null,
    };
  }
  return {
    init, update, rebuild, areaAt, stats,
    get visible() { return visible; },
    set visible(v) { visible = !!v; if (G && root && !visible) { setBody(false); setCard(false); } },
    get canvas() { return cv; },
    get landCanvas() { return land ? land.cv : null; },
    resetStats() { timing.n = 0; timing.i = 0; timing.max = 0; },
  };
})();
