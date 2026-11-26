'use strict';
// CULL: the world's draw calls nobody can see, skipped (the cleanup pass, 2026-11-20). Only the world's own render (main.js's
// camera over w3d.scene), never a battle, a cutaway or the title's own scenes. Nothing's `visible` is touched, so no module's own
// hiding and showing is disturbed: three.js asks its frustum whether each mesh is in view, and for the world's camera the
// frustum also asks
//   • how big the mesh is on screen: under MIN_PX (its bounding sphere's radius, in drawing-buffer pixels) it isn't drawn;
//   • for an ink hull (toonkit's back-face outline, «outline<width>») more than inkFar away, how thick its line is: under
//     opts.ink pixels it isn't drawn (up close every outline stays: a thin one still shades its edge);
//   • for a big mesh (a radius of BIG or more, often a merged one spread over a town or a lake), whether its box is in view: a
//     long or flat shape's sphere reaches far past it (the romance set's poem trail, the lake's shores).
// Left alone: instanced meshes (their sphere isn't theirs), points (their size is in pixels), anything whose shader moves its
// vertices (a sky, water, grass, a sway: their geometry's size isn't their size on screen), and the shadow pass. Things past the
// fog's far end aren't cut either: fully fogged, they still draw a fog-colored silhouette against the sky (the far hills).
// Checked with a pixel diff of the same frame drawn both ways (Alba's main street, plaza, Bruno's yard and the duck pond, four
// directions each): at most a few dozen pixels in a million change, single far specks and hairlines.
//   CULL.attach(renderer, scene) (main.js, once) · CULL.on (false: draw everything, for comparisons) · CULL.opts { min, ink, inkFar, big }
//   CULL.stats() → { tested, cut, zones } for the last world frame · CULL.ZONES (the measured groups hidden from a place, below)
const CULL = (() => {
  if (typeof THREE === 'undefined') return null;
  const opts = { min: 1.5, ink: 0.35, inkFar: 25, big: 30 };      // (inkFar: outlines are only cut past this far; up close they all stay)
  const S = new THREE.Sphere(), P = new THREE.Vector3(), MP = THREE.Material.prototype;
  let ctx = null, on = true, last = { tested: 0, cut: 0 };
  // an ink hull's push (toonkit's outlineMat: «outline0.02»), 0 for anything else
  const inks = new WeakMap();
  function inkOf(m) {
    if (!m || Array.isArray(m) || m.side !== THREE.BackSide || typeof m.customProgramCacheKey !== 'function') return 0;
    if (inks.has(m)) return inks.get(m);
    const x = /^outline(-?[\d.]+)/.exec(String(m.customProgramCacheKey())), w = x ? parseFloat(x[1]) || 0 : 0;
    inks.set(m, w); return w;
  }
  // does its shader move vertices? (a shader material, or a compile hook that touches the vertex shader: not the hull's push)
  const VS = ['#include <begin_vertex>', '#include <morphtarget_vertex>', '#include <skinning_vertex>', '#include <project_vertex>', '#include <worldpos_vertex>', '#include <fog_vertex>', 'void main() {', '}'].join('\n');
  const moved = new WeakMap();
  function moves(m) {
    if (!m) return false;
    if (Array.isArray(m)) return m.some(moves);
    if (moved.has(m)) return moved.get(m);
    let r = false;
    if (m.isShaderMaterial || m.isRawShaderMaterial || m.isPointsMaterial) r = true;
    else if (m.onBeforeCompile && m.onBeforeCompile !== MP.onBeforeCompile && !inkOf(m)) {
      const sh = { uniforms: {}, vertexShader: VS, fragmentShader: '#include <tonemapping_fragment>\n#include <fog_fragment>' };
      try { m.onBeforeCompile(sh); r = sh.vertexShader !== VS; } catch (e) { r = true; }
    }
    moved.set(m, r); return r;
  }
  // a big mesh's box in the world, kept while it stands still
  const boxes = new WeakMap();
  function boxOf(o, g) {
    const me = o.matrixWorld.elements; let c = boxes.get(o);
    if (!c || c.g !== g || c.m.some((v, i) => v !== me[i])) {
      if (g.boundingBox === null) g.computeBoundingBox();
      c = { g, m: me.slice(), box: g.boundingBox.clone().applyMatrix4(o.matrixWorld) }; boxes.set(o, c);
    }
    return c.box;
  }
  const F0 = THREE.Frustum.prototype.intersectsObject;
  THREE.Frustum.prototype.intersectsObject = function (o) {
    if (!F0.call(this, o)) return false;
    if (!ctx || !on) return true;
    if (!ctx.main) ctx.main = this;                // (the first frustum a world render tests is the camera's; the shadow map's comes later)
    if (this !== ctx.main || o.isInstancedMesh || o.isPoints || o.isSprite) return true;
    const g = o.geometry; if (!g || !g.attributes || !g.attributes.position || moves(o.material)) return true;
    if (g.boundingSphere === null) g.computeBoundingSphere();
    S.copy(g.boundingSphere).applyMatrix4(o.matrixWorld);
    ctx.tested++;
    if (S.radius >= opts.big) { if (this.intersectsBox(boxOf(o, g))) return true; ctx.cut++; return false; }
    const d = S.center.distanceTo(ctx.pos); if (d <= S.radius) return true;
    const px = S.radius / d * ctx.k;
    if (px < opts.min) { ctx.cut++; return false; }
    const w = d > opts.inkFar ? inkOf(o.material) : 0;
    if (w > 0 && w / Math.max(1e-6, g.boundingSphere.radius) * px < opts.ink) { ctx.cut++; return false; }
    return true;
  };
  // wrap the renderer: only renders of the world's scene get the checks
  function attach(renderer, scene) {
    if (!renderer || renderer._cull) return;
    const r0 = renderer.render.bind(renderer);
    renderer._cull = true;
    renderer.render = (s, c) => {
      if (s !== scene || !on || !c || !c.isPerspectiveCamera) return r0(s, c);
      const H = renderer.domElement.height || 1;
      ctx = { main: null, pos: c.getWorldPosition(P), k: (H / 2) / Math.tan(c.fov * Math.PI / 360), tested: 0, cut: 0 };
      // (a zone's group, hidden for this draw only: the module's own visible flag is put back right after)
      const hid = [];
      for (const Z of ZONES) { try { if (Z.when(c, ctx.pos)) { const g = Z.group(s); if (g && g.visible) { g.visible = false; hid.push(g); } } } catch (e) { /* */ } }
      try { return r0(s, c); } finally { for (const g of hid) g.visible = true; last = { tested: ctx.tested, cut: ctx.cut, zones: hid.length }; ctx = null; }
    };
  }
  // ------------------------------------------------------------ zones: a group nobody can see from somewhere, measured
  // Each { id, group(scene) → the Object3D, when(camera, position) → true while it can't be seen }. Measured, not guessed: the
  // camera stood at 30 spots across Alba, 8 directions, low and high, and every frame was drawn with and without the group.
  const ZONES = [];
  // the lake's view from Alba: it only ever shows when the view reaches far west (in every sighting some ray pointed within
  // about 20° of due west: x ≤ −0.93), never from up high. So with the camera low in Alba and no ray reaching further west than
  // WEST (x = −0.8; the view's half-width, a little more for the corners, either side of where it looks), the lake's group
  // (lake.js: its shores, water and Remanso, ~600,000 vertices in a few big merged meshes) isn't drawn. About 23 calls.
  // (y1: the play camera tops out near 8 high; the title's crane shot over the town, higher, keeps everything)
  const ALBA = { x0: -48, x1: 38, z0: -186, z1: -112, y1: 12 }, WEST = -0.8;     // (every sighting reached −0.93 or further)
  function viewWestMost(c) {
    const f = c.getWorldDirection(P2), th = Math.atan2(f.x, f.z), hh = Math.atan(Math.tan(c.fov * Math.PI / 360) * (c.aspect || 1)) * 1.15;
    const lo = th - hh, hi = th + hh, W = -Math.PI / 2;
    for (const w of [W, W + 2 * Math.PI, W - 2 * Math.PI]) if (w >= lo && w <= hi) return -1;      // (the view takes in due west)
    return Math.min(Math.sin(lo), Math.sin(hi));
  }
  const P2 = new THREE.Vector3();
  // the same for the east: the furthest east any ray of the view reaches (+1: it takes in due east)
  const viewEastMost = c => -viewWestMost({ getWorldDirection: v => { c.getWorldDirection(v); v.x = -v.x; return v; }, fov: c.fov, aspect: c.aspect });
  const inAlba = p => p.x > ALBA.x0 && p.x < ALBA.x1 && p.z > ALBA.z0 && p.z < ALBA.z1 && p.y < ALBA.y1;
  // (each group found once among the scene's own children: a name search of the whole scene every frame would cost more)
  const top = name => { let g = null; return s => (g && g.parent === s ? g : (g = s.children.find(ch => ch.name === name) || null)); };
  ZONES.push({ id: 'lake-from-alba', group: top('lake'), when: (c, p) => inAlba(p) && viewWestMost(c) > WEST });
  // Molinar's from Alba, the mirror: it only shows from the town's east side with the view taking in due east (every sighting),
  // never facing north, south or west. Its group (molinar.js: the windmill hills and the town) is about 22 calls.
  ZONES.push({ id: 'molinar-from-alba', group: top('molinar'), when: (c, p) => inAlba(p) && viewEastMost(c) < -WEST });
  return { attach, opts, ZONES, stats: () => last, get on() { return on; }, set on(v) { on = !!v; }, _: { inkOf, moves, viewWestMost, viewEastMost } };
})();
