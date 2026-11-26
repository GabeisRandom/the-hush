'use strict';
// The themed homes (DESIGN.md 16, playtest 4: "House interiors shouldnt be big for the sake of being big … do it like
// animal crossing. either decorate the space or make the space more compact"). Every home in Alba, Molinar and Remanso
// names a theme in its profile (interiors_alba.js, interiors_molinar.js, interiors_remanso.js); the theme lays out a
// compact room around who lives there: a painter's studio, a fisher's cottage, a clockmaker's apprentice's workbench…
//
// Part 1 (this file): the new furniture (drawn like interiors.js's: in a kit frame, front = +z, floor at y = 0; each
// returns its footprint for the solid and what Look teaches), and the layout engine every theme uses (LAY).
// Canonical layout (interiors.js's Z mirrors it per house): the front door in the middle of the south wall; when the
// house has a second room, the way up (or into the back room) runs along the east wall's south half, so that stays free.
// Upstairs, the stairs come up in the south-west corner; a back room's door is in the middle of its south wall.
//   ITH.F (the furniture) · ITH.lay(Z, spec) (a ground floor) · ITH.layUp(Z, spec) (the room upstairs / at the back)
const ITH = (() => {
  if (typeof INTERIORS === 'undefined' || !INTERIORS.kit) return null;
  const K = INTERIORS.kit, F0 = K.FURN, GEO = K.GEO, W8 = K.W8, INK = K.INK, shade = K.shade, mix = K.mix, pick = K.pick;
  const PI = Math.PI, PG = K.PG;
  const BRIGHT = ['#d9483b', '#3f6fb5', '#4f9a5a', '#f2c14e', '#7a5ab0', '#e0743c', '#2f8f86', '#e86a7a'];

  // ============================================================ small things (drawn at a spot in the current frame)
  const book = (k, x, y, z, col, ry = 0) => k.box(x, y + 0.025, z, 0.2, 0.05, 0.26, col, { ry, ink: 0.004 });
  const mug = (k, x, y, z, col) => { k.cyl(x, y, z, 0.05, 0.1, col, { geo: GEO.cyl8, ink: 0.004 }); k.add(GEO.thin, x + 0.06, y + 0.05, z, 0.03, 0.03, 0.03, col, { ry: PI / 2, ink: 0 }); };
  const pot = (k, x, y, z, r, h, col) => { k.cyl(x, y, z, r, h, col, { geo: GEO.bowl, ink: 0.005 }); k.cyl(x, y + h, z, r * 1.05, 0.03, shade(col, 0.85), { geo: GEO.cyl8, ink: 0 }); };
  const yarn = (k, x, y, z, col, s = 1) => { k.ball(x, y + 0.07 * s, z, 0.075 * s, col, { geo: GEO.ball6, ink: 0.004 }); k.add(GEO.thin, x, y + 0.07 * s, z, 0.06 * s, 0.06 * s, 0.06 * s, shade(col, 0.8), { rx: 0.7, ink: 0 }); };
  const flowerBunch = (k, x, y, z, R, col) => { for (let i = 0; i < 5; i++) { const a = i * 1.26, rr = 0.07; k.beam(x, y, z, x + Math.cos(a) * rr, y + 0.3, z + Math.sin(a) * rr, 0.012, '#4f9a45', { ink: 0 }); k.ball(x + Math.cos(a) * rr, y + 0.32, z + Math.sin(a) * rr, 0.05, col || pick(['#ff8fb1', '#ffd84a', '#ff6b5a', '#ffffff', '#b9a2ff'], R), { geo: GEO.ico0, ink: 0.004 }); } };
  const frameDecal = (k, x, y, z, w, h, cell, frame = '#c99a3e') => { k.box(x, y, z, w + 0.08, h + 0.08, 0.03, frame, { ink: 0.005 }); k.decal(x, y, z + 0.018, w, h, cell); };

  // ============================================================ the new furniture
  const F = {
    // a sofa with cushions (o.color, o.w)
    sofa(k, o, room) {
      const w = o.w || 1.8, c = o.color || '#5aa0d8', dk = shade(c, 0.82), rnd = room ? room.R : Math.random;
      k.post(0, 0.1, 0, w, 0.32, 0.8, c).post(0, 0.1, -0.3, w, 0.85, 0.22, dk);
      for (const s of [-1, 1]) k.post(s * (w / 2 - 0.08), 0.1, 0.02, 0.18, 0.55, 0.78, dk);
      for (let i = 0; i < 2; i++) k.box((i - 0.5) * (w - 0.4) / 2, 0.47, 0.06, (w - 0.42) / 2 - 0.02, 0.1, 0.6, shade(c, 1.08), { ink: 0.005 });
      for (const s of [-1, 1]) k.box(s * (w / 2 - 0.42), 0.68, -0.13, 0.36, 0.32, 0.1, o.pillow || pick(BRIGHT, rnd), { rx: -0.25, rz: s * 0.2, ink: 0.005 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.1), 0, sz * 0.3, 0.06, 0.1, 0.06, '#5b3a22', { ink: 0.004 });
      return { hw: w / 2, hd: 0.42, h: 0.95, seat: 0.5, look: 'w.chair', lookY: 1.2 };
    },
    // a low table: a teapot and cups, a book, a little plant (o.w)
    coffeeTable(k, o, room) {
      const w = o.w || 1.0, c = o.color || room.P.wood;
      k.box(0, 0.4, 0, w, 0.05, 0.55, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.07), 0, sz * 0.2, 0.05, 0.38, 0.05, shade(c, 0.8), { ink: 0.004 });
      const col = pick(room.P.fab, room.R);
      k.ball(-w * 0.25, 0.5, 0, 0.08, col, { ry2: 0.07 }); k.add(GEO.cone6, -w * 0.25 + 0.1, 0.52, 0, 0.018, 0.1, 0.018, col, { rz: -1.0, ink: 0.004 });
      K.cupOn(k, 0.05, 0.425, 0.12, col); K.cupOn(k, 0.12, 0.425, -0.12, col);
      book(k, w * 0.3, 0.425, 0.02, pick(BRIGHT, room.R), 0.3);
      return { hw: w / 2, hd: 0.28, h: 0.6, look: 'w.cup', lookY: 0.9, feat: 'cup' };
    },
    // an easel with a painting on it (o.cell), and a paint-spattered stool beside it
    easel(k, o) {
      for (const [x, z2] of [[-0.3, 0.12], [0.3, 0.12], [0, -0.35]]) k.beam(x * 0.4, 1.75, 0, x, 0, z2, 0.04, '#a8703f', { ink: 0.005 });
      k.box(0, 0.78, 0.09, 0.8, 0.05, 0.1, '#a8703f', { ink: 0.005 });
      k.box(0, 1.22, 0.06, 0.82, 0.8, 0.04, '#fdf8ee', { rx: -0.08, ink: 0.006 });
      k.decal(0, 1.22, 0.09, 0.76, 0.74, o.cell || 'abstract', { rx: -0.08 });
      return { r: 0.42, h: 1.8, look: null };
    },
    // canvases leaning on the wall
    canvases(k, o, room) {
      for (let i = 0; i < 3; i++) { const w = 0.5 + i * 0.12; k.box(-0.3 + i * 0.28, w / 2 + 0.02, 0.05 + i * 0.06, w, w, 0.03, i % 2 ? '#fdf8ee' : pick(BRIGHT, room.R), { rx: -0.18, ink: 0.005 }); }
      return { hw: 0.55, hd: 0.2, h: 0.8, look: null };
    },
    // a little table of paints: pots, a jar of brushes, a palette
    paintTable(k, o, room) {
      k.box(0, 0.7, 0, 0.9, 0.05, 0.55, '#c8925a'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.38, 0, sz * 0.2, 0.05, 0.68, 0.05, '#8a5f3e', { ink: 0.004 });
      BRIGHT.slice(0, 6).forEach((c, i) => k.cyl(-0.32 + (i % 3) * 0.14, 0.725, -0.12 + Math.floor(i / 3) * 0.14, 0.05, 0.08, c, { geo: GEO.cyl8, ink: 0.004 }));
      k.cyl(0.28, 0.725, -0.1, 0.06, 0.14, '#e8e2d6', { geo: GEO.cyl8, ink: 0.004 }); for (let i = 0; i < 4; i++) k.beam(0.28, 0.8, -0.1, 0.24 + i * 0.03, 1.02, -0.13 + i * 0.02, 0.012, '#c8925a', { ink: 0 });
      k.add(GEO.cyl16, 0.2, 0.73, 0.14, 0.16, 0.012, 0.11, '#d8b080', { ink: 0.004 }); for (let i = 0; i < 4; i++) k.ball(0.12 + i * 0.05, 0.745, 0.12 + (i % 2) * 0.04, 0.02, BRIGHT[i], { ink: 0 });
      void room; return { hw: 0.46, hd: 0.3, h: 0.9, look: null };
    },
    // a baby's crib with a mobile over it that turns (o.color)
    crib(k, o, room) {
      const c = o.color || '#fdf8ee', w = 0.7, L = 1.2;
      k.post(0, 0.2, 0, w, 0.12, L, '#bfe0f4'); k.box(0, 0.34, 0, w - 0.08, 0.1, L - 0.08, '#ffffff', { ink: 0.004 });
      for (const s of [-1, 1]) { k.box(s * w / 2, 0.85, 0, 0.05, 0.05, L, c, { ink: 0.004 }); for (let i = 0; i < 7; i++) k.post(s * w / 2, 0, -L / 2 + 0.05 + i * (L - 0.1) / 6, 0.035, 0.85, 0.035, c, { ink: 0.003 }); }
      for (const s of [-1, 1]) k.post(0, 0, s * L / 2, w + 0.06, 0.95, 0.05, c, { ink: 0.005 });
      k.ball(0.1, 0.42, -0.3, 0.12, '#e8a050', { geo: GEO.ball6, ink: 0.004 }); k.ball(0.1, 0.55, -0.3, 0.08, '#e8a050', { ink: 0.004 });
      k.post(w / 2 - 0.05, 0.9, -L / 2 + 0.05, 0.03, 0.7, 0.03, '#c8925a', { ink: 0.003 }); k.beam(w / 2 - 0.05, 1.6, -L / 2 + 0.05, 0, 1.6, -0.1, 0.02, '#c8925a', { ink: 0 });
      const at = k.world(0, 1.58, -0.1), b = room.rig.bone(null, [at.x, at.y, at.z], [0, 0, 0]);
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; room.rig.part(b, PG.cyl, INK, [Math.cos(a) * 0.15, -0.07, Math.sin(a) * 0.15], [0.004, 0.14, 0.004], null, 0); room.rig.part(b, PG.ball, ['#ffd84a', '#ff8fb1', '#8fd3ec', '#b6dbb8'][i], [Math.cos(a) * 0.15, -0.16, Math.sin(a) * 0.15], [0.05, 0.05, 0.02], null, 0.004); }
      room.spin.push({ b, speed: 0.5, axis: 'y' });
      room.feats.add('baby');
      return { hw: w / 2 + 0.05, hd: L / 2 + 0.03, h: 1.0, look: 'w.bed', lookY: 1.3 };
    },
    // toys on the floor: blocks, a ball, a little car, a teddy
    toys(k, o, room) {
      const R = room.R;
      for (let i = 0; i < 4; i++) k.box((i % 2) * 0.2, 0.07 + Math.floor(i / 2) * 0.14, (i % 3) * 0.08, 0.13, 0.13, 0.13, BRIGHT[i], { ry: i * 0.5, ink: 0.004 });
      k.ball(0.55, 0.11, 0.2, 0.11, '#d9483b', { ink: 0.004 }); k.add(GEO.thin, 0.55, 0.11, 0.2, 0.11, 0.11, 0.11, '#fdf8ee', { ink: 0 });
      k.box(-0.45, 0.06, 0.3, 0.24, 0.08, 0.13, '#3f6fb5', { ry: 0.6, ink: 0.004 }); for (const s of [-1, 1]) k.cyl(-0.45 + s * 0.08, 0.02, 0.3, 0.035, 0.15, INK, { rx: PI / 2, ry: 0.6, geo: GEO.cyl8, ink: 0 });
      const ted = pick(['#c98a4a', '#e8c57a', '#d9a0a8'], R); k.ball(0.2, 0.13, -0.35, 0.12, ted, { ink: 0.005 }); k.ball(0.2, 0.3, -0.35, 0.09, ted, { ink: 0.005 }); for (const s of [-1, 1]) k.ball(0.2 + s * 0.07, 0.38, -0.35, 0.035, ted, { ink: 0.003 });
      return { solid: false, look: null };
    },
    // a toy chest, things sticking out of it
    toyBox(k, o, room) {
      const c = o.color || '#e0743c';
      k.post(0, 0, 0, 0.8, 0.45, 0.5, c); k.box(0, 0.46, 0, 0.84, 0.04, 0.54, shade(c, 0.85));
      k.box(0, 0.25, 0.26, 0.5, 0.12, 0.01, '#fdf8ee', { ink: 0 });
      k.ball(-0.2, 0.55, 0, 0.1, '#3f6fb5', { ink: 0.004 }); k.beam(0.15, 0.4, -0.05, 0.25, 0.75, 0.05, 0.03, '#f2c14e', { ink: 0.004 }); k.box(0.05, 0.55, 0.1, 0.12, 0.12, 0.12, '#4f9a5a', { ry: 0.4, ink: 0.004 });
      void room; return { hw: 0.42, hd: 0.28, h: 0.7, look: null };
    },
    // bunk beds and their ladder
    bunks(k, o, room) {
      const w = 0.95, L = 2.0, wood = o.wood || room.P.wood;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.post(sx * (w / 2 + 0.04), 0, sz * (L / 2 - 0.05), 0.08, 1.9, 0.08, wood, { ink: 0.005 });
      for (const y of [0.3, 1.25]) { k.post(0, y, 0, w, 0.08, L - 0.06, shade(wood, 0.85)); k.box(0, y + 0.13, 0, w - 0.06, 0.14, L - 0.12, W8.cream, { ink: 0.004 }); k.box(0, y + 0.22, 0.2, w, 0.05, L - 0.55, y > 1 ? (o.q2 || '#3f6fb5') : (o.q1 || '#e86a7a'), { ink: 0.004 }); k.ball(0, y + 0.27, -L / 2 + 0.3, 0.22, W8.white, { ry2: 0.07, rz2: 0.13, ink: 0.005 }); }
      k.box(0, 1.7, L / 2 - 0.05, w + 0.1, 0.06, 0.06, wood, { ink: 0.004 }); k.box(0, 1.7, -L / 2 + 0.05, w + 0.1, 0.06, 0.06, wood, { ink: 0.004 });
      for (let i = 0; i < 5; i++) k.box(w / 2 + 0.07, 0.3 + i * 0.3, L / 2 - 0.35, 0.05, 0.04, 0.4, wood, { ink: 0.003 });
      return { hw: w / 2 + 0.1, hd: L / 2, h: 1.9, look: 'w.bed', lookY: 1.6, feat: 'bed' };
    },
    // a desk with what's on it (o.items: stamps letters typewriter homework radios maps stars notes), a lamp
    desk(k, o, room) {
      const w = o.w || 1.2, c = o.color || room.P.wood, R = room.R, top = 0.76;
      k.box(0, top - 0.03, 0, w, 0.05, 0.6, c); k.post(-w / 2 + 0.25, 0, 0, 0.46, top - 0.06, 0.55, shade(c, 0.9)); k.post(w / 2 - 0.05, 0, 0, 0.06, top - 0.06, 0.55, shade(c, 0.9), { ink: 0.004 });
      for (let i = 0; i < 3; i++) k.box(-w / 2 + 0.25, 0.15 + i * 0.2, 0.28, 0.4, 0.16, 0.01, shade(c, 0.8), { ink: 0.003 });
      K.tableLampAt(k, w / 2 - 0.18, top, -0.18, room);
      const it = o.items || 'letters';
      if (it === 'stamps') { for (let i = 0; i < 2; i++) k.box(-0.15 + i * 0.32, top + 0.03 + i * 0.03, 0.02, 0.3, 0.04, 0.24, i ? '#3f6fb5' : '#d9483b', { ry: i * 0.3, ink: 0.004 }); for (let i = 0; i < 6; i++) k.box(-0.35 + i * 0.07, top + 0.005, 0.2, 0.05, 0.005, 0.06, BRIGHT[i], { ink: 0 }); k.add(GEO.thin, 0.15, top + 0.02, 0.18, 0.06, 0.06, 0.06, W8.brass, { rx: PI / 2, ink: 0 }); }
      else if (it === 'typewriter') { k.post(-0.05, top, 0, 0.42, 0.14, 0.32, '#3a5a5a'); k.box(-0.05, top + 0.2, -0.12, 0.38, 0.12, 0.03, '#fdf8ee', { rx: -0.2, ink: 0.003 }); for (let i = 0; i < 8; i++) k.ball(-0.2 + (i % 4) * 0.1, top + 0.15, 0.06 + Math.floor(i / 4) * 0.06, 0.018, '#e8e2d6', { ink: 0 }); for (let i = 0; i < 3; i++) k.ball(0.35 + i * 0.06, top + 0.05, 0.15 - i * 0.1, 0.05, '#fdf8ee', { geo: GEO.ico0, ink: 0.003 }); }
      else if (it === 'homework') { book(k, -0.25, top, 0.05, '#3f6fb5', 0.2); k.box(0.05, top + 0.003, 0.08, 0.3, 0.005, 0.22, W8.white, { ry: -0.2, ink: 0.002 }); k.cyl(0.12, top + 0.01, 0.12, 0.01, 0.16, '#f2c14e', { rz: PI / 2, ry: 0.4, geo: GEO.cyl6, ink: 0.002 }); }
      else if (it === 'radios') { k.post(-0.25, top, -0.05, 0.36, 0.22, 0.2, '#8a5f3e'); k.add(GEO.cyl16, -0.32, top + 0.11, 0.06, 0.06, 0.01, 0.06, '#e6d6b0', { rx: PI / 2, ink: 0 }); k.post(0.15, top, 0.1, 0.18, 0.08, 0.14, '#3a3436'); for (let i = 0; i < 4; i++) k.beam(0.05 + i * 0.05, top + 0.01, 0.2, 0.25 - i * 0.03, top + 0.01, 0.25, 0.01, ['#d9483b', '#f2c14e', '#3f6fb5', '#4f9a5a'][i], { ink: 0 }); }
      else if (it === 'maps') { k.box(0, top + 0.003, 0.02, 0.7, 0.005, 0.45, '#efe0bc', { ry: 0.1, ink: 0.002 }); k.decal(0, top + 0.01, 0.02, 0.6, 0.4, 'world', { rx: -PI / 2, ry: 0.1 }); }
      else if (it === 'notes') { for (let i = 0; i < 3; i++) k.box(-0.2 + i * 0.15, top + 0.003 + i * 0.003, 0.05, 0.22, 0.005, 0.3, '#fbf6e7', { ry: (i - 1) * 0.3, ink: 0.002 }); }
      else { for (let i = 0; i < 4; i++) k.box(-0.3 + i * 0.16, top + 0.003, (i % 2) * 0.08, 0.2, 0.005, 0.14, i % 2 ? '#fdf8ee' : '#f3e4c4', { ry: (i - 1.5) * 0.25, ink: 0.002 }); }
      void R; room.feats.add('lamp');
      return { hw: w / 2, hd: 0.32, h: 1.0, look: 'w.lamp', lookY: 1.4, feat: 'table' };
    },
    // a bicycle on its stand
    bicycle(k, o) {
      const c = o.color || '#d9483b';
      for (const s of [-1, 1]) { k.add(GEO.torus, s * 0.48, 0.34, 0, 0.32, 0.32, 0.18, INK, { ry: PI / 2, ink: 0 }); k.add(GEO.cyl8, s * 0.48, 0.34, 0, 0.04, 0.12, 0.04, '#9aa0ad', { rx: PI / 2, ink: 0 }); }
      k.beam(-0.48, 0.34, 0, 0, 0.36, 0, 0.04, c).beam(0, 0.36, 0, 0.32, 0.78, 0, 0.04, c).beam(-0.48, 0.34, 0, -0.1, 0.75, 0, 0.04, c).beam(-0.1, 0.75, 0, 0.32, 0.78, 0, 0.04, c).beam(0, 0.36, 0, -0.1, 0.75, 0, 0.04, c).beam(0.48, 0.34, 0, 0.36, 0.85, 0, 0.04, c);
      k.box(-0.12, 0.82, 0, 0.18, 0.05, 0.1, INK, { ink: 0.003 }); k.box(0.36, 0.9, 0, 0.05, 0.05, 0.42, INK, { ink: 0.003 });
      k.cyl(0.45, 0.72, 0, 0.09, 0.1, '#fdf8ee', { rz: PI / 2, geo: GEO.cyl8, ink: 0.003 });
      return { hw: 0.85, hd: 0.2, h: 1.0, look: null };
    },
    // a guitar on its stand (o.color)
    guitar(k, o) {
      const c = o.color || '#e0743c';
      k.beam(-0.15, 0, 0.12, 0, 0.5, 0, 0.03, INK, { ink: 0 }).beam(0.15, 0, 0.12, 0, 0.5, 0, 0.03, INK, { ink: 0 }).beam(0, 0, -0.15, 0, 0.5, 0, 0.03, INK, { ink: 0 });
      k.ball(0, 0.38, 0.02, 0.24, c, { ry2: 0.28, rz2: 0.08, rx: -0.12 }); k.ball(0, 0.7, -0.02, 0.18, c, { ry2: 0.18, rz2: 0.08, rx: -0.12 });
      k.add(GEO.cyl16, 0, 0.52, 0.09, 0.07, 0.01, 0.07, INK, { rx: PI / 2 - 0.12, ink: 0 });
      k.beam(0, 0.8, -0.03, 0, 1.38, -0.1, 0.06, '#5e4130', { t2: 0.03 }); k.box(0, 1.44, -0.11, 0.1, 0.14, 0.04, '#5e4130', { rx: -0.12, ink: 0.004 });
      return { r: 0.3, h: 1.45, look: null };
    },
    // an amp, its grille and knobs
    amp(k, o) {
      const c = o.color || '#3a3436';
      k.post(0, 0, 0, 0.5, 0.55, 0.32, c); k.box(0, 0.24, 0.165, 0.42, 0.34, 0.01, '#5a5258', { ink: 0 }); k.add(GEO.cyl16, 0, 0.24, 0.172, 0.13, 0.01, 0.13, '#2b2830', { rx: PI / 2, ink: 0 });
      for (let i = 0; i < 4; i++) k.ball(-0.15 + i * 0.1, 0.48, 0.165, 0.02, W8.brass, { ink: 0 });
      return { hw: 0.27, hd: 0.18, h: 0.6, look: null };
    },
    // a record player on a little cabinet, records in a crate beside it
    records(k, o, room) {
      const c = o.color || room.P.wood;
      k.post(0, 0, 0, 0.9, 0.62, 0.45, c); k.box(0, 0.64, 0, 0.94, 0.04, 0.49, shade(c, 1.08));
      k.post(-0.15, 0.66, 0, 0.42, 0.08, 0.36, '#5e4130'); k.add(GEO.cyl24, -0.15, 0.75, 0, 0.15, 0.01, 0.15, '#2b2830', { ink: 0 }); k.add(GEO.cyl16, -0.15, 0.756, 0, 0.05, 0.005, 0.05, '#d9483b', { ink: 0 });
      k.beam(0.04, 0.78, -0.12, -0.06, 0.78, 0.05, 0.015, '#c9c4bb', { ink: 0 });
      for (let i = 0; i < 6; i++) k.box(0.18 + i * 0.04, 0.82, 0.02, 0.012, 0.28, 0.28, BRIGHT[(i + 2) % 8], { rz: 0.05 * (i - 3), ink: 0.002 });
      for (let i = 0; i < 4; i++) k.box(-0.3 + i * 0.12, 0.32, 0.23, 0.08, 0.36, 0.01, shade(c, 0.85), { ink: 0.002 });
      return { hw: 0.47, hd: 0.25, h: 1.0, look: null };
    },
    // a table full of candles, lit (o.w)
    candleTable(k, o, room) {
      const w = o.w || 1.1, c = o.color || room.P.wood;
      k.box(0, 0.72, 0, w, 0.05, 0.55, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.07), 0, sz * 0.2, 0.05, 0.7, 0.05, shade(c, 0.8), { ink: 0.004 });
      for (let i = 0; i < 9; i++) { const x = -w / 2 + 0.15 + (i % 5) * (w - 0.3) / 4, z = -0.14 + Math.floor(i / 5) * 0.22, h = 0.1 + ((i * 7) % 5) * 0.05, col = ['#fdf8ee', '#f2c14e', '#e86a7a', '#b6dbb8', '#bfe0f4'][i % 5];
        k.cyl(x, 0.745, z, 0.035, h, col, { geo: GEO.cyl8, ink: 0.003 }); k.add(GEO.cone6, x, 0.745 + h + 0.05, z, 0.022, 0.06, 0.022, '#ffcf5a', { b: 'glow', flick: 0.12 }); }
      return { hw: w / 2, hd: 0.3, h: 1.0, look: 'w.table', lookY: 1.2, feat: 'table' };
    },
    // a cake under a glass dome on a stand, and a slice cut
    cakeStand(k, o) {
      k.cyl(0, 0, 0, 0.18, 0.03, '#8a5f3e', { geo: GEO.cyl8 }).cyl(0, 0.03, 0, 0.03, 0.75, '#8a5f3e', { geo: GEO.cyl6, ink: 0.004 }).cyl(0, 0.78, 0, 0.3, 0.03, '#fdf8ee', { geo: GEO.cyl16 });
      const col = o.color || '#f6a6c1';
      k.cyl(0, 0.81, 0, 0.22, 0.12, '#fdf3dc', { geo: GEO.cyl16, ink: 0.004 }).cyl(0, 0.93, 0, 0.2, 0.1, col, { geo: GEO.cyl16, ink: 0.004 }); k.ball(0, 1.05, 0, 0.04, '#e2453a', { ink: 0.003 });
      k.ball(0, 0.81, 0, 0.29, '#dff4ff', { geo: GEO.half, ry2: 0.38, b: 'glow', c2: '#ffffff' });
      return { r: 0.32, h: 1.2, look: null };
    },
    // a telescope on its tripod, pointing up at the window
    telescope(k, o) {
      for (const a of [0, 2.1, 4.2]) k.beam(0, 1.0, 0, Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35, 0.03, '#5e4130', { ink: 0.004 });
      k.cyl(0, 1.0, 0.05, 0.08, 0.95, o.color || '#3f6fb5', { rx: -0.9, geo: GEO.cyl8 }); k.cyl(0, 1.0, 0.05, 0.06, 0.25, W8.brass, { rx: -0.9 + PI, geo: GEO.cyl8, ink: 0.004 });
      return { r: 0.4, h: 1.8, look: null };
    },
    // a basket of yarn, knitting needles stuck in it
    yarnBasket(k, o, room) {
      k.cyl(0, 0, 0, 0.24, 0.24, '#c9955a', { geo: GEO.bowl, ink: 0.006 });
      for (let i = 0; i < 4; i++) yarn(k, -0.08 + (i % 2) * 0.15, 0.17, -0.06 + Math.floor(i / 2) * 0.12, pick(room.P.fab, room.R), 1.1);
      k.beam(0.05, 0.25, 0, 0.18, 0.55, -0.05, 0.012, '#c8925a', { ink: 0 }).beam(0.02, 0.25, 0.02, -0.1, 0.55, 0.05, 0.012, '#c8925a', { ink: 0 });
      return { r: 0.26, h: 0.4, look: null, solid: false };
    },
    // a little puppet theater: a painted frame, red curtains, the stage
    puppetBooth(k, o) {
      const c = o.color || '#3f6fb5';
      k.post(0, 0, 0, 1.4, 0.9, 0.4, c); for (const s of [-1, 1]) k.post(s * 0.62, 0.9, 0, 0.16, 0.9, 0.4, c); k.post(0, 1.7, 0, 1.5, 0.3, 0.42, shade(c, 0.85));
      for (const s of [-1, 1]) k.box(s * 0.42, 1.3, 0.12, 0.3, 0.72, 0.04, '#d9483b', { ink: 0.005 }); k.box(0, 1.62, 0.13, 1.1, 0.14, 0.05, '#c9443a', { ink: 0.004 });
      k.glow(0, 1.3, -0.1, 0.9, 0.7, '#3a2a40'); k.box(0, 1.86, 0.22, 0.6, 0.12, 0.02, '#f2c14e', { ink: 0.003 });
      return { hw: 0.75, hd: 0.24, h: 2.0, look: null };
    },
    // pots and pans hanging from a rail on the wall, a garlic braid
    potRail(k, o) {
      const L = o.len || 1.2;
      k.box(0, 0, 0.06, L, 0.04, 0.04, '#3a3436', { ink: 0.003 });
      for (let i = 0; i < 4; i++) { const x = -L / 2 + 0.18 + i * (L - 0.36) / 3, r = 0.1 + (i % 2) * 0.04; k.beam(x, 0, 0.06, x, -0.12, 0.08, 0.01, INK, { ink: 0 }); k.add(GEO.cyl16, x, -0.2 - r, 0.1, r, 0.03, r, i % 2 ? '#c9783a' : '#3a3436', { rx: PI / 2, ink: 0.004 }); k.box(x, -0.2 + 0.02, 0.1, 0.03, 0.14, 0.02, '#3a3436', { ink: 0 }); }
      for (let i = 0; i < 5; i++) k.ball(L / 2 + 0.12, -0.12 - i * 0.1, 0.08, 0.05, '#f4efe4', { geo: GEO.ball6, ink: 0.003 });
      return { look: null };
    },
    // herbs drying upside down on a rail
    herbRail(k, o) {
      const L = o.len || 1.2;
      k.box(0, 0, 0.08, L, 0.04, 0.04, '#7a5236', { ink: 0.003 });
      for (let i = 0; i < 6; i++) { const x = -L / 2 + 0.1 + i * (L - 0.2) / 5; k.beam(x, 0, 0.08, x, -0.1, 0.08, 0.01, '#d8b080', { ink: 0 }); k.add(GEO.cone6, x, -0.22, 0.08, 0.07, 0.24, 0.07, ['#5f8a3a', '#7fa84a', '#9a7ab0', '#c9b04a'][i % 4], { rx: PI, ink: 0.004 }); }
      return { look: null };
    },
    // a cage on a stand; the canary is a pet put at its spot (the cage's floor is at 1.1)
    birdCage(k, o) {
      k.cyl(0, 0, 0, 0.18, 0.03, '#5e4130', { geo: GEO.cyl8 }).cyl(0, 0.03, 0, 0.025, 1.05, '#5e4130', { geo: GEO.cyl6, ink: 0.003 });
      k.cyl(0, 1.06, 0, 0.26, 0.05, o.color || '#e6b84a', { geo: GEO.cyl16, ink: 0.004 });
      for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; k.beam(Math.cos(a) * 0.25, 1.1, Math.sin(a) * 0.25, Math.cos(a) * 0.2, 1.62, Math.sin(a) * 0.2, 0.012, o.color || '#e6b84a', { ink: 0 }); }
      k.ball(0, 1.6, 0, 0.21, o.color || '#e6b84a', { geo: GEO.half, ry2: 0.14, ink: 0.004 }); k.add(GEO.thin, 0, 1.82, 0, 0.05, 0.05, 0.05, o.color || '#e6b84a', { ink: 0 });
      k.beam(-0.18, 1.3, 0, 0.18, 1.3, 0, 0.015, '#c8925a', { ink: 0 });
      return { r: 0.3, h: 1.9, look: null };
    },
    // a parrot's T-perch with a seed cup (the parrot's spot is on top, at 1.25)
    perch(k) {
      k.cyl(0, 0, 0, 0.22, 0.04, '#5e4130', { geo: GEO.cyl8 }).cyl(0, 0.04, 0, 0.03, 1.2, '#8a5f3e', { geo: GEO.cyl6, ink: 0.004 });
      k.beam(-0.3, 1.22, 0, 0.3, 1.22, 0, 0.04, '#8a5f3e'); k.cyl(0.26, 1.16, 0, 0.06, 0.07, '#fdf8ee', { geo: GEO.cyl8, ink: 0.003 });
      return { r: 0.3, h: 1.4, look: null };
    },
    // fishing rods on the wall, a reel and a landing net
    rods(k) {
      for (let i = 0; i < 3; i++) { const x = -0.5 + i * 0.4; k.beam(x - 0.3, -0.8, 0.05, x + 0.35, 0.9, 0.05, 0.025, ['#8a5f3e', '#3f6fb5', '#2f8f86'][i], { ink: 0.003 }); k.add(GEO.cyl8, x - 0.18, -0.48, 0.09, 0.05, 0.04, 0.05, '#9aa0ad', { rx: PI / 2, ink: 0.002 }); }
      k.add(GEO.thin, 0.75, 0.2, 0.06, 0.22, 0.22, 0.22, '#7a5236', { ink: 0 }); k.beam(0.75, -0.02, 0.06, 0.75, -0.6, 0.06, 0.025, '#7a5236', { ink: 0 });
      return { look: null };
    },
    // a tackle box, a bucket with fish tails sticking up
    tackle(k) {
      k.post(-0.3, 0, 0, 0.42, 0.2, 0.26, '#2f8f86'); k.box(-0.3, 0.21, 0, 0.44, 0.03, 0.28, '#1f6f68', { ink: 0.003 }); k.box(-0.3, 0.25, 0, 0.12, 0.05, 0.03, '#3a3436', { ink: 0 });
      k.cyl(0.25, 0, 0, 0.18, 0.32, '#9aa0ad', { geo: GEO.bowl }); k.add(GEO.thin, 0.25, 0.35, 0, 0.17, 0.17, 0.17, '#9aa0ad', { rx: PI / 2 - 0.4, ink: 0 });
      for (let i = 0; i < 3; i++) k.add(GEO.cone6, 0.2 + i * 0.06, 0.38, -0.04 + i * 0.04, 0.05, 0.1, 0.02, '#7fb0c9', { rz: (i - 1) * 0.4, ink: 0.003 });
      return { hw: 0.5, hd: 0.2, h: 0.4, look: null };
    },
    // a fish mounted on a board (a trophy, on a wall)
    fishTrophy(k) {
      k.box(0, 0, 0.02, 0.8, 0.36, 0.04, '#8a5f3e', { ink: 0.005 });
      k.ball(-0.04, 0, 0.08, 0.26, '#7fb0c9', { ry2: 0.1, rz2: 0.05 }); k.add(GEO.cone6, 0.28, 0, 0.08, 0.1, 0.18, 0.03, '#5f90a9', { rz: PI / 2 });
      k.ball(-0.22, 0.02, 0.12, 0.02, INK, { ink: 0 });
      return { look: null };
    },
    // a sewing machine on its table, fabric under the needle
    sewingTable(k, o, room) {
      const c = o.color || room.P.wood;
      k.box(0, 0.74, 0, 1.1, 0.05, 0.55, c); for (const sx of [-1, 1]) k.post(sx * 0.48, 0, 0, 0.06, 0.72, 0.5, shade(c, 0.85), { ink: 0.004 });
      k.post(-0.05, 0.765, 0, 0.5, 0.1, 0.22, '#3a3436'); k.post(0.16, 0.86, 0, 0.1, 0.25, 0.16, '#3a3436'); k.box(-0.05, 1.12, 0, 0.5, 0.1, 0.16, '#3a3436'); k.post(-0.25, 0.86, 0, 0.04, 0.2, 0.04, '#9aa0ad', { ink: 0.002 });
      k.add(GEO.cyl16, 0.25, 1.02, 0, 0.09, 0.04, 0.09, W8.brass, { rz: PI / 2, ink: 0.003 }); k.box(-0.05, 1.12, 0.085, 0.3, 0.04, 0.01, W8.brass, { ink: 0 });
      k.box(-0.2, 0.773, 0.1, 0.45, 0.01, 0.35, o.fabric || pick(room.P.fab, room.R), { ry: 0.3, ink: 0.003 });
      return { hw: 0.56, hd: 0.3, h: 1.2, look: 'w.table', lookY: 1.3, feat: 'table' };
    },
    // a dress form with a half-made dress pinned on it, a tape measure round its neck
    dressForm(k, o) {
      k.cyl(0, 0, 0, 0.2, 0.03, '#5e4130', { geo: GEO.cyl8 }).cyl(0, 0.03, 0, 0.025, 0.85, '#5e4130', { geo: GEO.cyl6, ink: 0.003 });
      k.ball(0, 1.12, 0, 0.21, '#efe6d0', { ry2: 0.3, rz2: 0.15 }); k.cyl(0, 1.42, 0, 0.05, 0.1, '#5e4130', { geo: GEO.cyl8, ink: 0.003 });
      k.cyl(0, 0.75, 0, 0.3, 0.42, o.color || '#e86a7a', { geo: GEO.taper, rz2: 0.24 }); k.ball(0, 1.05, 0.02, 0.215, o.color || '#e86a7a', { ry2: 0.17, rz2: 0.155, ink: 0.004 });
      k.add(GEO.thin, 0, 1.36, 0, 0.13, 0.13, 0.13, '#f2c14e', { rx: PI / 2 - 0.3, ink: 0 }); k.beam(0.12, 1.34, 0.05, 0.14, 1.0, 0.13, 0.012, '#f2c14e', { ink: 0 });
      return { r: 0.3, h: 1.5, look: null };
    },
    // rolls of fabric standing in a basket
    fabricRolls(k, o, room) {
      k.cyl(0, 0, 0, 0.32, 0.36, '#c9955a', { geo: GEO.bowl, ink: 0.006 });
      for (let i = 0; i < 5; i++) { const a = i * 1.25; k.cyl(Math.cos(a) * 0.14, 0.05, Math.sin(a) * 0.12, 0.07, 1.0 + (i % 3) * 0.15, pick(room.P.fab.concat(BRIGHT), room.R), { rx: 0.08 * Math.cos(a), rz: 0.08 * Math.sin(a), geo: GEO.cyl8, ink: 0.004 }); }
      return { r: 0.34, h: 1.2, look: null };
    },
    // a board of spools on pegs (on a wall)
    spools(k) {
      k.box(0, 0, 0.02, 0.9, 0.6, 0.03, '#d8b080', { ink: 0.004 });
      for (let i = 0; i < 12; i++) { const x = -0.34 + (i % 6) * 0.135, y = 0.15 - Math.floor(i / 6) * 0.3; k.cyl(x, y - 0.06, 0.07, 0.04, 0.12, BRIGHT[i % 8], { geo: GEO.cyl8, ink: 0.003 }); }
      k.add(GEO.thin, 0.55, -0.1, 0.06, 0.1, 0.1, 0.1, '#9aa0ad', { ink: 0 }); k.beam(0.55, -0.1, 0.06, 0.6, -0.4, 0.06, 0.012, '#9aa0ad', { ink: 0 });
      return { look: null };
    },
    // a games table: a board mid-game, dice, the box beside it
    gameTable(k, o, room) {
      const w = 0.9, c = o.color || room.P.wood;
      k.box(0, 0.72, 0, w, 0.05, w, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.38, 0, sz * 0.38, 0.05, 0.7, 0.05, shade(c, 0.8), { ink: 0.004 });
      k.box(0, 0.75, 0, 0.58, 0.012, 0.58, '#fdf3dc', { ink: 0.003 });
      const Q = ['#d9483b', '#3f6fb5', '#4f9a5a', '#f2c14e'];
      for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; k.box(Math.cos(a) * 0.2, 0.758, Math.sin(a) * 0.2, 0.14, 0.006, 0.14, Q[i], { ink: 0 }); for (let j = 0; j < 2; j++) k.cyl(Math.cos(a) * (0.2 - j * 0.1) + 0.03, 0.76, Math.sin(a) * (0.12 + j * 0.05), 0.022, 0.05, Q[i], { geo: GEO.cyl8, ink: 0.002 }); }
      for (let i = 0; i < 2; i++) k.box(0.36 + i * 0.07, 0.775, 0.3, 0.05, 0.05, 0.05, W8.white, { ry: i, ink: 0.003 });
      return { hw: w / 2, hd: w / 2, h: 0.8, look: 'w.table', lookY: 1.1, feat: 'table' };
    },
    // a table with a jigsaw half done, the box lid propped up
    jigsaw(k, o, room) {
      const w = 1.1, c = o.color || room.P.wood;
      k.box(0, 0.72, 0, w, 0.05, 0.7, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.07), 0, sz * 0.28, 0.05, 0.7, 0.05, shade(c, 0.8), { ink: 0.004 });
      k.box(-0.1, 0.748, 0, 0.6, 0.005, 0.45, '#9fc7d9', { ink: 0.002 }); k.box(-0.25, 0.751, -0.05, 0.3, 0.005, 0.3, '#7fbf6a', { ink: 0 });
      for (let i = 0; i < 9; i++) k.box(0.32 + (i % 3) * 0.05, 0.75, -0.15 + Math.floor(i / 3) * 0.1, 0.04, 0.006, 0.04, ['#9fc7d9', '#7fbf6a', '#f2c14e'][i % 3], { ry: i, ink: 0 });
      k.box(0.35, 0.86, 0.22, 0.32, 0.22, 0.02, '#e86a7a', { rx: -0.4, ink: 0.003 });
      return { hw: w / 2, hd: 0.36, h: 0.9, look: 'w.table', lookY: 1.1, feat: 'table' };
    },
    // newspapers in a pile, a pencil on top
    papers(k) {
      for (let i = 0; i < 8; i++) k.box(((i * 7) % 3 - 1) * 0.02, 0.015 + i * 0.03, 0, 0.42, 0.028, 0.3, i % 3 ? '#f4f0e6' : '#e8e2d6', { ry: (i % 4) * 0.08, ink: 0.002 });
      k.cyl(0.05, 0.26, 0, 0.012, 0.18, '#f2c14e', { rz: PI / 2, ry: 0.5, geo: GEO.cyl6, ink: 0.002 });
      return { r: 0.26, h: 0.3, look: null };
    },
    // a dog's round bed and its bowl (the dog is a pet put at the 'dog' spot)
    dogBed(k, o) {
      const c = o.color || '#c9553f';
      k.add(GEO.torus, 0, 0.1, 0, 0.42, 0.42, 0.55, c, { rx: PI / 2 }); k.cyl(0, 0, 0, 0.42, 0.08, shade(c, 1.2), { geo: GEO.cyl16, ink: 0 });
      k.cyl(0.62, 0, 0.25, 0.13, 0.07, '#3f6fb5', { geo: GEO.bowl, ink: 0.003 }); k.box(0.66, 0.03, -0.12, 0.2, 0.04, 0.06, '#fdf8ee', { ry: 0.6, ink: 0.003 });
      return { solid: false, look: null };
    },
    // a clothes horse with laundry drying on it
    laundry(k, o, room) {
      for (const s of [-1, 1]) { k.beam(s * 0.55, 0, -0.25, s * 0.55, 1.2, 0, 0.03, '#c8925a', { ink: 0.003 }); k.beam(s * 0.55, 0, 0.25, s * 0.55, 1.2, 0, 0.03, '#c8925a', { ink: 0.003 }); }
      for (const y of [0.7, 1.1]) k.box(0, y, 0, 1.1, 0.02, 0.02, '#c8925a', { ink: 0 });
      const cl = room.P.fab.concat(BRIGHT);
      k.box(-0.3, 0.92, 0, 0.36, 0.36, 0.02, cl[0], { ink: 0.003 }); k.box(0.12, 0.55, 0, 0.28, 0.3, 0.02, cl[3], { ink: 0.003 }); k.box(0.32, 0.95, 0, 0.18, 0.3, 0.02, cl[5], { ink: 0.003 });
      for (const s of [-1, 1]) k.box(-0.1 + s * 0.06, 0.95, 0.01, 0.07, 0.25, 0.02, cl[1], { ink: 0.002 });
      return { hw: 0.6, hd: 0.28, h: 1.2, look: null };
    },
    // a potter's wheel with a pot turning on it (a bone of the rig, so it spins)
    potteryWheel(k, o, room) {
      k.cyl(0, 0, 0, 0.3, 0.45, '#8a8a96', { geo: GEO.cyl8 }).cyl(0, 0.45, 0, 0.36, 0.06, '#5a5258', { geo: GEO.cyl16, ink: 0.004 });
      k.post(0, 0, -0.5, 0.36, 0.42, 0.3, '#8a5f3e');
      const at = k.world(0, 0.52, 0), b = room.rig.bone(null, [at.x, at.y, at.z], [0, 0, 0]);
      room.rig.part(b, PG.disc, '#b8b1a3', null, [0.28, 0.03, 0.28], null, 0.006);
      room.rig.part(b, PG.lathe, '#c9784a', [0, 0.02, 0], [0.16, 0.24, 0.16], null, 0.006);
      room.spin.push({ b, speed: 3.0, axis: 'y' });
      return { r: 0.42, h: 0.8, look: null };
    },
    // a brick kiln, glowing at its door
    kiln(k) {
      k.post(0, 0, 0, 0.8, 0.7, 0.7, '#b5654a'); k.ball(0, 0.7, 0, 0.4, '#b5654a', { geo: GEO.half, ry2: 0.3, rz2: 0.35 });
      k.glow(0, 0.35, 0.355, 0.36, 0.3, '#ffb04a', { c2: '#e0502a' }); k.cyl(0.2, 0.9, -0.15, 0.08, 0.6, '#9a9488', { geo: GEO.cyl8, ink: 0.004 });
      return { hw: 0.42, hd: 0.37, h: 1.5, look: 'w.oven', lookY: 1.5, feat: 'oven' };
    },
    // a shelf on a wall with the house's own things (o.what: pots honey jam candles cheese toys shells candy boxes hats
    // lanterns trophies bottlesShip stamps cups keys), one or two levels
    shelf(k, o, room) {
      const L = o.len || 1.0, levels = o.levels || 1, c = o.color || room.P.wood, R = room.R, what = o.what || 'pots';
      for (let j = 0; j < levels; j++) {
        const y = j * 0.46; k.box(0, y, 0.12, L, 0.04, 0.24, c); for (const s of [-1, 1]) k.box(s * (L / 2 - 0.08), y - 0.09, 0.06, 0.04, 0.16, 0.12, shade(c, 0.85), { ink: 0.003 });
        const n = Math.max(2, Math.floor(L / 0.2)), xs = i => -L / 2 + 0.12 + i * (L - 0.24) / (n - 1);
        for (let i = 0; i < n; i++) {
          const x = xs(i), y0 = y + 0.02;
          if (what === 'pots') pot(k, x, y0, 0.12, 0.06 + (i % 2) * 0.02, 0.1 + (i % 3) * 0.04, ['#c9784a', '#b85a3a', '#e8e2d6', '#4f8a7a'][i % 4]);
          else if (what === 'honey' || what === 'jam') { k.cyl(x, y0, 0.12, 0.055, 0.12, what === 'honey' ? '#f2a83a' : ['#c9443a', '#7a3f5a', '#e0743c'][i % 3], { geo: GEO.cyl8, ink: 0.003 }); k.cyl(x, y0 + 0.12, 0.12, 0.06, 0.03, '#fdf8ee', { geo: GEO.cyl8, ink: 0 }); }
          else if (what === 'candles') { const h = 0.1 + (i % 3) * 0.05; k.cyl(x, y0, 0.12, 0.03, h, ['#fdf8ee', '#f2c14e', '#e86a7a'][i % 3], { geo: GEO.cyl8, ink: 0.003 }); k.add(GEO.cone6, x, y0 + h + 0.04, 0.12, 0.02, 0.05, 0.02, '#ffcf5a', { b: 'glow', flick: 0.12 }); }
          else if (what === 'cheese') { k.cyl(x, y0, 0.12, 0.08, 0.07, '#f2c14e', { geo: GEO.cyl16, ink: 0.004 }); }
          else if (what === 'toys') { if (i % 3 === 0) k.ball(x, y0 + 0.07, 0.12, 0.07, BRIGHT[i % 8], { ink: 0.003 }); else if (i % 3 === 1) k.box(x, y0 + 0.06, 0.12, 0.1, 0.12, 0.1, BRIGHT[(i + 3) % 8], { ry: 0.4, ink: 0.003 }); else { k.cyl(x, y0, 0.12, 0.05, 0.08, BRIGHT[(i + 5) % 8], { geo: GEO.cone6, rx: PI, ink: 0.003 }); } }
          else if (what === 'shells') k.ball(x, y0 + 0.04, 0.12, 0.05, ['#f6d5c8', '#fdf3dc', '#e8b4a0', '#f2e2c8'][i % 4], { geo: GEO.ball6, ry2: 0.035, rz2: 0.06, ry: i, ink: 0.003 });
          else if (what === 'candy') { k.cyl(x, y0, 0.12, 0.06, 0.16, '#dff4ff', { geo: GEO.cyl8, ink: 0.003 }); for (let q = 0; q < 3; q++) k.ball(x + (q - 1) * 0.025, y0 + 0.04 + q * 0.03, 0.12, 0.022, BRIGHT[(i + q) % 8], { ink: 0 }); }
          else if (what === 'boxes') k.box(x, y0 + 0.05 + (i % 2) * 0.02, 0.12, 0.17, 0.1 + (i % 2) * 0.04, 0.2, BRIGHT[(i + 1) % 8], { ink: 0.003 });
          else if (what === 'hats') { k.cyl(x, y0, 0.12, 0.1, 0.012, ['#d8b080', '#3a3040', '#c9443a', '#4f8a7a'][i % 4], { geo: GEO.cyl16, ink: 0.002 }); k.ball(x, y0 + 0.01, 0.12, 0.06, ['#d8b080', '#3a3040', '#c9443a', '#4f8a7a'][i % 4], { geo: GEO.half, ink: 0.003 }); }
          else if (what === 'lanterns') { k.post(x, y0, 0.12, 0.09, 0.14, 0.09, '#3a3436', { ink: 0.003 }); k.box(x, y0 + 0.07, 0.12, 0.07, 0.1, 0.07, '#ffe2a0', { b: 'glow', c2: '#ffc870' }); k.add(GEO.cone6, x, y0 + 0.17, 0.12, 0.06, 0.05, 0.06, '#3a3436', { ink: 0.002 }); }
          else if (what === 'trophies') { k.cyl(x, y0, 0.12, 0.04, 0.03, '#5e4130', { geo: GEO.cyl8, ink: 0.002 }); k.cyl(x, y0 + 0.03, 0.12, 0.012, 0.06, W8.brass, { geo: GEO.cyl6, ink: 0 }); k.cyl(x, y0 + 0.09, 0.12, 0.05, 0.08, W8.brass, { geo: GEO.bowl, rx: PI, ink: 0.003 }); }
          else if (what === 'ship') { if (i % 2 === 0) { k.cyl(x, y0 + 0.05, 0.12, 0.045, 0.2, '#cfe8f2', { rz: PI / 2, geo: GEO.cyl8, b: 'glow' }); k.box(x, y0 + 0.06, 0.12, 0.08, 0.04, 0.02, '#8a5f3e', { ink: 0 }); } else k.ball(x, y0 + 0.05, 0.12, 0.05, '#f6d5c8', { geo: GEO.ball6, ink: 0.003 }); }
          else if (what === 'cups') { mug(k, x, y0, 0.12, BRIGHT[i % 8]); }
          else if (what === 'keys') { k.add(GEO.thin, x, y0 + 0.08, 0.13, 0.04, 0.04, 0.04, W8.brass, { ink: 0 }); k.box(x, y0 + 0.02, 0.13, 0.015, 0.08, 0.01, W8.brass, { ink: 0 }); }
          else if (what === 'books') { K.booksRow(k, -L / 2 + 0.06, L / 2 - 0.06, y0, 0.12, R, 0.16); room.feats.add('books'); break; }
          else K.jarAt(k, x, y0, 0.12, R);
        }
      }
      return { look: what === 'books' ? 'w.book' : what === 'cups' ? 'w.cup' : null, lookY: 0.2, front: 0.9 };
    },
    // suitcases stacked, stickers on them
    suitcases(k, o, room) {
      const cols = o.colors || ['#8a5f3e', '#3f6fb5', '#d9483b'];
      for (let i = 0; i < 3; i++) { const w = 0.75 - i * 0.12, h = 0.24 - i * 0.03, y = [0, 0.24, 0.45][i]; k.post(0, y, 0, w, h, 0.45 - i * 0.05, cols[i], { ry: (i - 1) * 0.15 }); k.box(0, y + h + 0.015, 0, 0.16, 0.03, 0.03, '#3a3436', { ry: (i - 1) * 0.15, ink: 0 }); k.box(w * 0.25, y + h / 2, 0.23 - i * 0.025, 0.12, 0.09, 0.005, BRIGHT[(i + 3) % 8], { ry: (i - 1) * 0.15, ink: 0 }); }
      void room; return { hw: 0.4, hd: 0.25, h: 0.7, look: null };
    },
    // a hammock slung between two posts
    hammock(k, o) {
      const L = o.len || 2.0, c = o.color || '#e0743c';
      for (const s of [-1, 1]) k.post(s * L / 2, 0, 0, 0.1, 1.5, 0.1, '#8a5f3e');
      for (let i = 0; i < 8; i++) { const t = i / 7, x = (t - 0.5) * (L - 0.4), y = 0.85 - Math.sin(t * PI) * 0.3; k.box(x, y, 0, (L - 0.4) / 7 + 0.02, 0.04, 0.7, i % 2 ? c : shade(c, 1.15), { rz: Math.cos(t * PI) * 0.4, ink: 0.003 }); }
      for (const s of [-1, 1]) k.beam(s * L / 2, 1.3, 0, s * (L / 2 - 0.2), 0.85, 0, 0.012, '#d8c08a', { ink: 0 });
      return { hw: L / 2 + 0.05, hd: 0.4, h: 1.5, look: null };
    },
    // cardboard boxes, half unpacked (moving in)
    boxes(k, o, room) {
      const B = '#c99a5a', T = '#e8d4a8';
      k.post(-0.25, 0, 0, 0.55, 0.45, 0.5, B); k.post(-0.25, 0.45, 0.02, 0.48, 0.38, 0.44, shade(B, 1.08)); k.post(0.4, 0, 0.1, 0.5, 0.4, 0.45, shade(B, 0.95));
      for (const [x, y, w] of [[-0.25, 0.45, 0.55], [-0.25, 0.83, 0.48], [0.4, 0.4, 0.5]]) k.box(x, y + 0.005, 0.02, 0.1, 0.01, w * 0.9, T, { ink: 0 });
      k.box(0.32, 0.47, 0.1, 0.28, 0.12, 0.22, '#3f6fb5', { rx: 0.4, ink: 0.003 }); book(k, 0.5, 0.4, 0.12, '#d9483b', 0.5);
      void room; return { hw: 0.7, hd: 0.3, h: 0.9, look: null };
    },
    // a garden bench with trays of seedlings and a watering can
    seedTable(k, o, room) {
      const w = o.w || 1.3;
      k.box(0, 0.7, 0, w, 0.05, 0.5, '#a8784a'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.06), 0, sz * 0.2, 0.05, 0.68, 0.05, '#7a5236', { ink: 0.004 }); k.box(0, 0.25, 0, w - 0.1, 0.04, 0.44, '#a8784a', { ink: 0.003 });
      for (let i = 0; i < 2; i++) { const x = -w / 4 + i * w / 2; k.post(x, 0.725, 0, w / 2 - 0.08, 0.06, 0.4, '#5b3a22', { ink: 0.003 }); for (let j = 0; j < 6; j++) k.add(GEO.ico0, x - 0.18 + (j % 3) * 0.18, 0.82, -0.1 + Math.floor(j / 3) * 0.2, 0.05, 0.05, 0.05, '#6ab653', { ink: 0 }); }
      k.cyl(-w / 2 + 0.25, 0.27, 0, 0.12, 0.2, '#4f8a7a', { geo: GEO.cyl8, ink: 0.004 }); k.beam(-w / 2 + 0.33, 0.35, 0, -w / 2 + 0.55, 0.45, 0, 0.02, '#4f8a7a', { ink: 0.002 });
      for (let i = 0; i < 3; i++) K.plantAt(k, w / 2 - 0.2 - i * 0.25, 0.27, 0.05, 0.4, room.R, { flowers: i % 2 === 0 });
      return { hw: w / 2, hd: 0.27, h: 0.95, look: null };
    },
    // two sawhorses, a plank across them, a saw, shavings on the floor
    sawhorse(k) {
      for (const s of [-1, 1]) { const x = s * 0.5; k.box(x, 0.62, 0, 0.08, 0.06, 0.5, '#c8925a'); for (const z of [-0.2, 0.2]) { k.beam(x, 0.6, z, x - 0.12, 0, z * 1.4, 0.04, '#a8703f', { ink: 0.003 }); k.beam(x, 0.6, z, x + 0.12, 0, z * 1.4, 0.04, '#a8703f', { ink: 0.003 }); } }
      k.box(0, 0.68, 0, 1.6, 0.06, 0.3, '#e6c08a'); k.box(0.3, 0.73, 0.02, 0.5, 0.03, 0.12, '#9aa0ad', { ry: 0.3, ink: 0.003 }); k.box(0.62, 0.73, 0.04, 0.12, 0.04, 0.05, '#7a4f2e', { ry: 0.3, ink: 0.003 });
      for (let i = 0; i < 5; i++) k.box(-0.4 + i * 0.22, 0.006, 0.35 + (i % 2) * 0.1, 0.12, 0.008, 0.06, '#f2d29a', { ry: i, ink: 0 });
      return { hw: 0.85, hd: 0.3, h: 0.75, look: null };
    },
    // tools on a pegboard (on a wall)
    pegboard(k) {
      k.box(0, 0, 0.02, 1.1, 0.7, 0.03, '#c8a070', { ink: 0.004 });
      k.box(-0.38, 0.05, 0.06, 0.04, 0.4, 0.02, '#7a4f2e', { ink: 0.002 }); k.box(-0.38, 0.24, 0.06, 0.16, 0.06, 0.03, '#9aa0ad', { ink: 0.002 });
      k.box(-0.12, 0, 0.06, 0.08, 0.5, 0.01, '#9aa0ad', { ink: 0.002 }); k.box(-0.12, -0.27, 0.06, 0.1, 0.1, 0.02, '#7a4f2e', { ink: 0.002 });
      k.add(GEO.thin, 0.15, 0.12, 0.06, 0.08, 0.08, 0.08, '#d9483b', { ink: 0 }); k.box(0.15, -0.08, 0.06, 0.025, 0.3, 0.02, '#9aa0ad', { ink: 0 });
      k.box(0.4, 0.05, 0.06, 0.06, 0.45, 0.02, '#f2c14e', { rz: 0.1, ink: 0.002 });
      return { look: null };
    },
    // a fish tank on its stand: water, plants, little fish swimming (bones of the rig)
    aquarium(k, o, room) {
      const w = o.w || 1.1;
      k.post(0, 0, 0, w, 0.7, 0.45, '#5e4130'); k.post(0, 0.7, 0, w, 0.04, 0.45, '#3a3436');
      k.box(0, 1.06, 0, w - 0.04, 0.66, 0.41, '#7fd3e8', { b: 'glow', c2: '#3f8fc9' }); k.box(0, 1.41, 0, w + 0.02, 0.05, 0.45, '#3a3436', { ink: 0.004 });
      for (let i = 0; i < 4; i++) k.add(GEO.cone6, -w / 2 + 0.15 + i * (w - 0.3) / 3, 0.8, -0.08 + (i % 2) * 0.12, 0.05, 0.3 + (i % 2) * 0.15, 0.04, '#3fae5a', { ink: 0.003 });
      k.box(0.2, 0.76, 0.05, 0.2, 0.06, 0.12, '#c9c4bb', { ry: 0.5, ink: 0.003 });
      const fish = [];
      for (let i = 0; i < 4; i++) { const at = k.world(0, 1.0 + i * 0.1, 0), b = room.rig.bone(null, [at.x, at.y, at.z], [0, 0, 0]); room.rig.part(b, PG.ball, ['#f29a3a', '#f2c14e', '#e86a7a', '#8fd3ec'][i], null, [0.06, 0.04, 0.03], null, 0.003); room.rig.part(b, PG.cone, ['#f29a3a', '#f2c14e', '#e86a7a', '#8fd3ec'][i], [-0.07, 0, 0], [0.03, 0.05, 0.015], [0, 0, PI / 2], 0.002); fish.push({ b, base: at.clone(), ph: i * 1.7, sp: 0.5 + i * 0.15 }); }
      const u = k.world(1, 0, 0).sub(k.world(0, 0, 0)), rot = k.rot, hwT = w / 2 - 0.12;
      room.anims.push(t => { for (const f of fish) { const s = Math.sin(t * f.sp + f.ph); f.b.position.copy(f.base).addScaledVector(u, s * hwT); f.b.position.y = f.base.y + Math.sin(t * 1.3 + f.ph) * 0.05; f.b.rotation.y = rot + (Math.cos(t * f.sp + f.ph) > 0 ? 0 : PI); } });
      room.feats.add('fish');
      return { hw: w / 2, hd: 0.25, h: 1.45, look: null };
    },
    // a weaving loom, a cloth growing on it
    loom(k, o, room) {
      const c = '#8a5f3e';
      for (const s of [-1, 1]) { k.post(s * 0.65, 0, -0.3, 0.08, 1.5, 0.08, c); k.post(s * 0.65, 0, 0.3, 0.08, 0.9, 0.08, c); k.beam(s * 0.65, 0.88, 0.3, s * 0.65, 1.46, -0.3, 0.06, c, { ink: 0.003 }); }
      k.box(0, 1.45, -0.3, 1.36, 0.08, 0.08, c); k.box(0, 0.85, 0.3, 1.36, 0.08, 0.1, c); k.box(0, 0.5, 0, 1.36, 0.06, 0.06, c, { ink: 0.003 });
      for (let i = 0; i < 14; i++) k.beam(-0.6 + i * 0.092, 1.42, -0.28, -0.6 + i * 0.092, 0.9, 0.25, 0.008, '#fdf8ee', { ink: 0 });
      const cl = room.P.fab; for (let i = 0; i < 5; i++) k.box(0, 0.92 + i * 0.05, 0.22 - i * 0.03, 1.2, 0.05, 0.02, cl[i % cl.length], { rx: -0.85, ink: 0 });
      k.post(0, 0, 0.75, 0.9, 0.42, 0.32, c, { ink: 0.004 });
      return { hw: 0.72, hd: 0.45, h: 1.55, look: null };
    },
    // a hat stand with hats on its hooks, hat boxes at its foot
    hatStand(k, o, room) {
      k.cyl(0, 0, 0, 0.2, 0.04, '#5b3a22', { geo: GEO.cyl8 }).cyl(0, 0.04, 0, 0.03, 1.6, '#5b3a22', { geo: GEO.cyl6, ink: 0.003 });
      const H = ['#3a3040', '#c9443a', '#d8b080'];
      for (let i = 0; i < 3; i++) { const a = i * 2.1, x = Math.cos(a) * 0.17, z = Math.sin(a) * 0.17, y = 1.4 + i * 0.08; k.cyl(x, y, z, 0.14, 0.015, H[i], { geo: GEO.cyl16, ink: 0.002 }); k.ball(x, y, z, 0.09, H[i], { geo: GEO.half, ink: 0.003 }); }
      for (let i = 0; i < 2; i++) k.cyl(0.35, i * 0.22, 0.2, 0.2 - i * 0.03, 0.2, ['#f6a6c1', '#8fd3ec'][i], { geo: GEO.cyl16, ink: 0.004 });
      void room; return { r: 0.3, h: 1.6, look: null };
    },
    // buckets of cut flowers on the floor
    flowerBuckets(k, o, room) {
      for (let i = 0; i < 3; i++) { const x = -0.45 + i * 0.45; k.cyl(x, 0, 0, 0.17, 0.32, ['#9aa0ad', '#3f6fb5', '#9aa0ad'][i], { geo: GEO.bowl }); for (let j = 0; j < 3; j++) flowerBunch(k, x + (j - 1) * 0.06, 0.3, (j % 2) * 0.05, room.R, ['#ff8fb1', '#ffd84a', '#ff6b5a', '#b9a2ff', '#ffffff'][(i + j) % 5]); }
      return { hw: 0.7, hd: 0.2, h: 0.7, look: null };
    },
    // an upright piano, music open on it, its bench
    piano(k, o, room) {
      const c = o.color || '#3a3040';
      k.post(0, 0, -0.12, 1.4, 1.25, 0.42, c); k.box(0, 0.74, 0.16, 1.36, 0.06, 0.32, c); k.box(0, 0.78, 0.2, 1.24, 0.03, 0.18, '#fdf8ee', { ink: 0.002 });
      for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) k.box(-0.58 + i * 0.068, 0.81, 0.15, 0.03, 0.03, 0.1, INK, { ink: 0 });
      for (const s of [-1, 1]) k.post(s * 0.62, 0, 0.18, 0.08, 0.74, 0.08, shade(c, 0.85), { ink: 0.003 });
      k.box(0, 1.0, 0.1, 0.5, 0.32, 0.02, '#fbf6e7', { rx: -0.25, ink: 0.002 }); K.candleAt(k, -0.5, 1.25, -0.1); K.vaseAt(k, 0.48, 1.25, -0.12, pick(room.P.fab, room.R), room.R);
      k.box(0, 0.45, 0.75, 0.8, 0.06, 0.34, shade(c, 1.2)); for (const sx of [-1, 1]) k.post(sx * 0.34, 0, 0.75, 0.05, 0.42, 0.3, shade(c, 0.9), { ink: 0.003 });
      return { hw: 0.72, hd: 0.36, h: 1.3, look: null };
    },
    // a music stand with sheet music
    musicStand(k, o) {
      k.cyl(0, 0, 0, 0.18, 0.02, INK, { geo: GEO.cyl6, ink: 0 }); k.beam(0, 0, 0, 0, 1.1, 0, 0.025, INK, { ink: 0 });
      k.box(0, 1.2, 0.02, 0.48, 0.34, 0.02, INK, { rx: -0.35, ink: 0 }); k.decal(0, 1.21, 0.04, 0.44, 0.3, 'notes', { rx: -0.35 });
      void o; return { r: 0.22, h: 1.4, look: null };
    },
    // a rocking horse (it rocks: a bone of the rig)
    rockingHorse(k, o, room) {
      const at = k.world(0, 0, 0), b = room.rig.bone(null, [at.x, at.y, at.z], [0, k.rot, 0], 'YXZ'), c = o.color || '#e8dcc0';
      for (const s of [-1, 1]) room.rig.part(b, PG.box, '#8a5f3e', [s * 0.15, 0.05, 0], [0.04, 0.05, 0.9], null, 0.004);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) room.rig.part(b, PG.cyl, c, [x * 0.12, 0.25, z * 0.25], [0.035, 0.42, 0.035], null, 0.004);
      room.rig.part(b, PG.ball, c, [0, 0.5, 0], [0.16, 0.13, 0.32], null, 0.006); room.rig.part(b, PG.ball, c, [0, 0.72, 0.3], [0.09, 0.15, 0.09], [0.5, 0, 0], 0.005);
      room.rig.part(b, PG.ball, c, [0, 0.82, 0.42], [0.08, 0.07, 0.13], null, 0.005); room.rig.part(b, PG.box, '#d9483b', [0, 0.7, 0.22], [0.04, 0.2, 0.12], [0.5, 0, 0], 0.003); room.rig.part(b, PG.box, '#d9483b', [0, 0.62, 0.0], [0.2, 0.04, 0.24], null, 0.003);
      room.anims.push(t => { b.rotation.x = Math.sin(t * 1.4) * 0.12; });
      return { hw: 0.25, hd: 0.5, h: 1.0, look: null };
    },
    // a camera on its tripod (the bellows kind)
    tripodCamera(k) {
      for (const a of [0, 2.1, 4.2]) k.beam(0, 1.2, 0, Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32, 0.03, '#8a5f3e', { ink: 0.003 });
      k.post(0, 1.2, 0, 0.3, 0.26, 0.24, '#3a3436'); k.post(0, 1.24, 0.2, 0.22, 0.2, 0.16, '#5a3a2a', { ink: 0.003 }); k.cyl(0, 1.34, 0.3, 0.07, 0.08, '#3a3436', { rx: PI / 2, geo: GEO.cyl8, ink: 0.003 });
      k.add(GEO.cyl8, 0, 1.34, 0.345, 0.05, 0.01, 0.05, '#8fd3ec', { rx: PI / 2, b: 'glow' });
      return { r: 0.35, h: 1.5, look: null };
    },
    // a wall of photos in frames (o.cells)
    photoWall(k, o) {
      const cells = o.cells || ['family', 'baby', 'lake', 'hills', 'dog', 'grandma'];
      const P = [[-0.45, 0.2, 0.34, 0.28], [0, 0.25, 0.3, 0.38], [0.42, 0.18, 0.32, 0.26], [-0.4, -0.22, 0.28, 0.32], [0.05, -0.2, 0.36, 0.26], [0.44, -0.24, 0.26, 0.3]];
      P.forEach(([x, y, w, h], i) => frameDecal(k, x, y, 0.02, w, h, cells[i % cells.length], ['#c99a3e', '#3a3040', '#fdf8ee', '#8a5f3e'][i % 4]));
      return { look: null };
    },
    // a chess table mid-game
    chessTable(k, o, room) {
      const c = o.color || room.P.wood;
      k.cyl(0, 0.7, 0, 0.42, 0.05, c, { geo: GEO.cyl16 }).cyl(0, 0, 0, 0.06, 0.7, shade(c, 0.8), { geo: GEO.cyl8, ink: 0.003 }).cyl(0, 0, 0, 0.22, 0.04, shade(c, 0.8), { geo: GEO.cyl8 });
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) k.box(-0.2 + i * 0.057, 0.752, -0.2 + j * 0.057, 0.057, 0.004, 0.057, '#5e4130', { ink: 0 });
      k.box(0, 0.751, 0, 0.46, 0.003, 0.46, '#efe0bc', { ink: 0.002 });
      for (let i = 0; i < 10; i++) { const x = -0.17 + (i % 5) * 0.085, z = i < 5 ? -0.17 : 0.17, w = i % 2 ? '#fdf8ee' : '#2b2235'; k.cyl(x, 0.755, z + (i % 3) * 0.03, 0.018, 0.05 + (i % 4) * 0.015, w, { geo: GEO.cyl8, ink: 0.002 }); }
      return { r: 0.45, h: 0.85, look: 'w.table', lookY: 1.1, feat: 'table' };
    },
    // a model of a windmill whose sails turn (a bone), on a little table
    windmillModel(k, o, room) {
      k.post(0, 0, 0, 0.5, 0.6, 0.5, room.P.wood); k.cyl(0, 0.6, 0, 0.18, 0.55, '#fdf8ee', { geo: GEO.taper, ink: 0.004 }); k.add(GEO.cone, 0, 1.25, 0, 0.17, 0.2, 0.17, '#c9643f', { ink: 0.004 });
      const at = k.world(0, 1.05, 0.2), b = room.rig.bone(null, [at.x, at.y, at.z], [0, k.rot, 0]);
      for (let i = 0; i < 4; i++) room.rig.part(b, PG.box, '#e8dcc0', [Math.cos(i * PI / 2) * 0.16, Math.sin(i * PI / 2) * 0.16, 0], [0.32, 0.07, 0.01], [0, 0, i * PI / 2], 0.003);
      room.spin.push({ b, speed: o.speed || 1.2 });
      return { hw: 0.27, hd: 0.27, h: 1.4, look: null };
    },
    // paper pinwheels in a jar, spinning (on a sill or a table: o.y)
    pinwheels(k, o, room) {
      const y = o.y || 0;
      k.cyl(0, y, 0, 0.08, 0.18, '#dff4ff', { geo: GEO.cyl8, ink: 0.003 });
      for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.1, top = y + 0.5 + i * 0.07; k.beam(0, y + 0.1, 0, x, top, 0.02, 0.008, '#c8925a', { ink: 0 }); const at = k.world(x, top, 0.04), b = room.rig.bone(null, [at.x, at.y, at.z], [0, k.rot, 0]); for (let j = 0; j < 4; j++) room.rig.part(b, PG.box, BRIGHT[(i * 2 + j) % 8], [Math.cos(j * PI / 2) * 0.05, Math.sin(j * PI / 2) * 0.05, 0], [0.1, 0.05, 0.005], [0, 0, j * PI / 2 + 0.4], 0.002); room.spin.push({ b, speed: 2 + i }); }
      return { r: 0.15, h: y + 0.7, look: null, solid: o.solid };
    },
    // a little rowboat on trestles, half painted (o.color: the new paint)
    rowboat(k, o) {
      const L = 2.4, B = 0.8, wood = '#b98a55', paint = o.color || '#2f8f86';
      for (const s of [-1, 1]) k.post(s * 0.7, 0, 0, 0.1, 0.4, 0.7, '#7a5236');
      for (let i = 0; i < 7; i++) { const x = -L / 2 + 0.2 + i * (L - 0.4) / 6, f = Math.sin((i + 0.5) / 7 * PI), half = 0.15 + f * B / 2, h = 0.15 + f * 0.25; for (const s of [-1, 1]) k.beam(x, 0.44, 0, x, 0.44 + h, s * half, 0.07, x < 0 ? paint : wood, { t2: 0.05, ink: 0.004 }); }
      k.box(0, 0.44, 0, L - 0.3, 0.08, 0.18, shade(wood, 0.8));
      k.cyl(0.9, 0, 0.55, 0.12, 0.22, paint, { geo: GEO.cyl8, ink: 0.004 }); k.cyl(0.6, 0, 0.6, 0.1, 0.18, '#f2c14e', { geo: GEO.cyl8, ink: 0.004 }); k.beam(0.9, 0.22, 0.55, 1.05, 0.5, 0.62, 0.015, '#c8925a', { ink: 0 });
      return { hw: L / 2, hd: 0.5, h: 0.9, look: null };
    },
    // a ship's wheel on a wall
    shipWheel(k) {
      k.add(GEO.torus, 0, 0, 0.06, 0.42, 0.42, 0.3, '#8a5f3e', { ink: 0.005 }); k.add(GEO.cyl16, 0, 0, 0.06, 0.1, 0.06, 0.1, W8.brass, { rx: PI / 2, ink: 0.004 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; k.beam(0, 0, 0.06, Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.06, 0.035, '#8a5f3e', { ink: 0.003 }); }
      return { look: null };
    },
    // a sea chest with rope handles
    seaChest(k, o) {
      const c = o.color || '#3f6fb5';
      k.post(0, 0, 0, 0.9, 0.42, 0.5, c); k.ball(0, 0.42, 0, 0.45, shade(c, 0.9), { geo: GEO.half, ry2: 0.12, rz2: 0.25 });
      for (const s of [-1, 1]) k.box(s * 0.3, 0.27, 0, 0.06, 0.5, 0.52, W8.brass, { ink: 0.002 }); k.box(0, 0.3, 0.26, 0.1, 0.12, 0.02, W8.brass, { ink: 0.002 });
      for (const s of [-1, 1]) k.add(GEO.thin, s * 0.47, 0.28, 0, 0.08, 0.08, 0.08, '#d8c08a', { ry: PI / 2, ink: 0 });
      return { hw: 0.47, hd: 0.27, h: 0.6, look: null };
    },
    // a barometer and a thermometer on a wooden plaque (a wall)
    barometer(k) {
      k.box(0, 0, 0.02, 0.36, 0.8, 0.04, '#8a5f3e', { ink: 0.004 });
      k.add(GEO.cyl24, 0, 0.18, 0.05, 0.14, 0.02, 0.14, W8.cream, { rx: PI / 2, ink: 0.003 }); k.box(0.03, 0.2, 0.065, 0.012, 0.11, 0.005, INK, { rz: -0.6, ink: 0 });
      k.box(0, -0.2, 0.05, 0.05, 0.3, 0.01, W8.cream, { ink: 0.002 }); k.box(0, -0.27, 0.06, 0.02, 0.14, 0.005, '#d9483b', { ink: 0 });
      return { look: null };
    },
    // a wind chime hanging from the ceiling; it sways (a bone of the rig)
    windChime(room, x, z, y) {
      const b = room.rig.bone(null, [x, y, z], [0, 0, 0], 'XYZ');
      room.rig.part(b, PG.cyl, '#8a5f3e', null, [0.12, 0.03, 0.12], null, 0.003);
      for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; room.rig.part(b, PG.cyl, '#cfe8f2', [Math.cos(a) * 0.08, -0.18 - (i % 3) * 0.05, Math.sin(a) * 0.08], [0.012, 0.22 + (i % 3) * 0.08, 0.012], null, 0.002); }
      room.rig.part(b, PG.cyl, '#e8dcc0', [0, 0.25, 0], [0.005, 0.5, 0.005], null, 0);
      room.anims.push(t => { b.rotation.x = Math.sin(t * 1.1) * 0.12; b.rotation.z = Math.sin(t * 0.8 + 1) * 0.1; });
    },
    // a low tub of water with stones (the turtle is a pet at its 'turtle' spot)
    basin(k) {
      k.cyl(0, 0, 0, 0.55, 0.22, '#9aa0ad', { geo: GEO.cyl16 }); k.cyl(0, 0.2, 0, 0.5, 0.01, '#7fd3e8', { geo: GEO.cyl16, b: 'glow', c2: '#3f8fc9' });
      k.ball(0.25, 0.2, -0.15, 0.12, '#b8b1a3', { ry2: 0.06, ink: 0.004 }); k.ball(-0.28, 0.2, 0.1, 0.09, '#aea795', { ry2: 0.05, ink: 0.003 });
      return { r: 0.58, h: 0.3, look: null };
    },
    // a butter churn
    churn(k) {
      k.cyl(0, 0, 0, 0.2, 0.62, '#c8925a', { geo: GEO.taper }); for (const y of [0.12, 0.48]) k.cyl(0, y, 0, 0.21, 0.04, '#3a3436', { geo: GEO.cyl8, ink: 0 });
      k.cyl(0, 0.62, 0, 0.16, 0.03, '#a8703f', { geo: GEO.cyl8, ink: 0.003 }); k.cyl(0, 0.6, 0, 0.02, 0.45, '#8a5f3e', { geo: GEO.cyl6, ink: 0.003 });
      return { r: 0.22, h: 1.1, look: null };
    },
    // a mortar and pestle on a little table, herbs and jars
    herbTable(k, o, room) {
      const w = o.w || 1.0;
      k.box(0, 0.74, 0, w, 0.05, 0.55, room.P.wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.07), 0, sz * 0.2, 0.05, 0.72, 0.05, shade(room.P.wood, 0.8), { ink: 0.004 });
      k.cyl(-0.2, 0.765, 0, 0.12, 0.1, '#9a9488', { geo: GEO.bowl, ink: 0.004 }); k.beam(-0.2, 0.8, 0, -0.1, 1.0, 0.05, 0.025, '#8a8a96', { ink: 0.003 });
      for (let i = 0; i < 3; i++) K.jarAt(k, 0.1 + i * 0.13, 0.765, -0.1, room.R);
      for (let i = 0; i < 4; i++) k.add(GEO.ico0, -0.35 + i * 0.1, 0.78, 0.15, 0.05, 0.02, 0.08, ['#5f8a3a', '#7fa84a', '#9a7ab0', '#5f8a3a'][i], { ry: i, ink: 0 });
      return { hw: w / 2, hd: 0.3, h: 1.0, look: null };
    },
    // a big table with a sail spread on it, being stitched
    sailTable(k, o) {
      k.box(0, 0.72, 0, 1.8, 0.06, 0.9, '#c8925a'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.8, 0, sz * 0.36, 0.07, 0.7, 0.07, '#8a5f3e', { ink: 0.004 });
      k.box(0.1, 0.756, 0, 1.6, 0.01, 0.82, '#f6f1e7', { ry: 0.1, ink: 0.003 }); k.box(0.92, 0.6, 0.1, 0.05, 0.3, 0.6, '#f6f1e7', { rz: 0.4, ink: 0.003 });
      for (let i = 0; i < 4; i++) k.box(-0.6 + i * 0.4, 0.763, 0.05, 0.02, 0.004, 0.7, '#c9b48a', { ry: 0.1, ink: 0 });
      void o; return { hw: 0.95, hd: 0.45, h: 0.8, look: 'w.table', lookY: 1.1, feat: 'table' };
    },
    // a coil of rope
    ropeCoil(k) {
      for (let i = 0; i < 4; i++) k.add(GEO.torus, 0, 0.05 + i * 0.08, 0, 0.32 - i * 0.03, 0.32 - i * 0.03, 0.3, '#d8c08a', { rx: PI / 2, ink: 0.003 });
      return { r: 0.36, h: 0.35, look: null, solid: false };
    },
    // a ladder leaning on a wall
    ladder(k, o) {
      const h = o.h || 2.4;
      for (const s of [-1, 1]) k.beam(s * 0.22, 0, 0.35, s * 0.22, h, 0.04, 0.05, '#a8703f', { ink: 0.004 });
      for (let i = 1; i < 7; i++) { const t = i / 7; k.box(0, t * h, 0.35 - t * 0.31, 0.44, 0.04, 0.04, '#a8703f', { ink: 0.002 }); }
      return { hw: 0.28, hd: 0.2, h, look: null };
    },
    // beehive boxes stacked, frames of comb leaning, a smoker
    hives(k) {
      for (let i = 0; i < 3; i++) k.post(0, i * 0.24, 0, 0.5, 0.22, 0.4, ['#fdf8ee', '#f2c14e', '#fdf8ee'][i]);
      k.box(0, 0.74, 0, 0.56, 0.05, 0.46, '#c9643f', { ink: 0.004 });
      for (let i = 0; i < 2; i++) k.box(0.45, 0.25, -0.1 + i * 0.12, 0.04, 0.45, 0.32, '#e6a23a', { rz: -0.2, ink: 0.003 });
      k.cyl(-0.45, 0, 0.1, 0.07, 0.22, '#9aa0ad', { geo: GEO.cyl8, ink: 0.003 }); k.add(GEO.cone6, -0.45, 0.28, 0.1, 0.06, 0.08, 0.06, '#9aa0ad', { ink: 0.002 });
      return { hw: 0.55, hd: 0.25, h: 0.8, look: null };
    },
    // a mat on the floor (exercise, or for a dog)
    mat(k, o) { k.box(0, 0.012, 0, o.w || 0.7, 0.02, o.d || 1.6, o.color || '#4fb3a9', { ink: 0.004 }); return { solid: false, look: null }; },
    // an umbrella stand by the door
    umbrellas(k) {
      k.cyl(0, 0, 0, 0.13, 0.42, '#3f6fb5', { geo: GEO.cyl8 });
      for (let i = 0; i < 2; i++) { k.beam((i - 0.5) * 0.08, 0.2, 0, (i - 0.5) * 0.14, 0.95, 0.02, 0.025, ['#d9483b', '#2b2235'][i], { ink: 0.002 }); k.add(GEO.cone6, (i - 0.5) * 0.1, 0.45, 0, 0.06, 0.4, 0.06, ['#d9483b', '#2b2235'][i], { ink: 0.003 }); }
      return { r: 0.16, h: 1.0, look: null };
    },
    // a shoe rack with shoes
    shoeRack(k) {
      k.post(0, 0, 0, 0.8, 0.36, 0.28, '#c8925a'); k.box(0, 0.18, 0, 0.76, 0.03, 0.26, shade('#c8925a', 0.85), { ink: 0.002 });
      for (let i = 0; i < 4; i++) { k.ball(-0.28 + i * 0.18, 0.24, 0.02, 0.07, BRIGHT[i], { ry2: 0.04, rz2: 0.11, ink: 0.003 }); k.ball(-0.24 + i * 0.18, 0.4, 0.0, 0.065, BRIGHT[(i + 4) % 8], { ry2: 0.04, rz2: 0.1, ink: 0.003 }); }
      return { hw: 0.42, hd: 0.16, h: 0.45, look: null };
    },
    // an old radio on a cabinet, a doily, a photo
    radio(k, o, room) {
      const c = o.color || room.P.wood;
      k.post(0, 0, 0, 0.7, 0.62, 0.4, c); k.box(0, 0.64, 0, 0.74, 0.04, 0.44, shade(c, 1.08));
      k.cyl(0, 0.66, 0, 0.25, 0.005, '#fdf8ee', { geo: GEO.cyl16, ink: 0 });
      k.post(-0.05, 0.665, 0, 0.42, 0.3, 0.22, '#7a4f2e'); k.add(GEO.half, -0.05, 0.96, 0, 0.21, 0.08, 0.11, '#7a4f2e', { ink: 0.004 }); k.box(-0.05, 0.82, 0.112, 0.32, 0.16, 0.01, '#e6d6b0', { ink: 0 }); for (const s of [-1, 1]) k.ball(-0.05 + s * 0.1, 0.71, 0.115, 0.025, W8.brass, { ink: 0 });
      frameDecal(k, 0.25, 0.8, 0.0, 0.14, 0.18, o.cell || 'family');
      return { hw: 0.37, hd: 0.22, h: 1.0, look: null };
    },
    // a patchwork quilt hung on a wall
    quilt(k, o, room) {
      const w = o.w || 1.2, h = o.h || 1.0, cl = room.P.fab.concat(BRIGHT);
      k.box(0, h / 2 + 0.04, 0.05, w + 0.1, 0.04, 0.04, '#8a5f3e', { ink: 0.003 });
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) k.box(-w / 2 + w / 8 + i * w / 4, -h / 2 + h / 6 + j * h / 3, 0.03, w / 4, h / 3, 0.02, cl[(i * 3 + j) % cl.length], { ink: 0.002 });
      return { look: null };
    },
    // a garland along the top of a wall: little flags or lights (o.lights)
    garland(k, o) {
      const L = o.len || 2.0, n = Math.round(L / 0.22);
      for (let i = 0; i <= n; i++) { const t = i / n, x = (t - 0.5) * L, y = -Math.sin(t * PI) * 0.18; if (o.lights) k.ball(x, y - 0.05, 0.08, 0.04, BRIGHT[i % 8], { b: 'glow' }); else k.add(GEO.cone6, x, y - 0.08, 0.06, 0.07, 0.14, 0.01, BRIGHT[i % 8], { rx: PI, ink: 0.002 }); }
      for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; k.beam((t0 - 0.5) * L, -Math.sin(t0 * PI) * 0.18, 0.06, (t1 - 0.5) * L, -Math.sin(t1 * PI) * 0.18, 0.06, 0.008, INK, { ink: 0 }); }
      return { look: null };
    },
    // a kitchen table with what's cooking: a big pot, vegetables, bread (o.w)
    cookTable(k, o, room) {
      const w = o.w || 1.4, c = o.color || room.P.wood, top = 0.78;
      k.box(0, top - 0.04, 0, w, 0.08, 0.75, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.08), 0, sz * 0.28, 0.08, top - 0.08, 0.08, shade(c, 0.82), { ink: 0.005 });
      k.box(-w * 0.2, top + 0.015, 0, 0.42, 0.03, 0.28, '#d8b080', { ink: 0.003 }); for (let i = 0; i < 3; i++) k.ball(-w * 0.28 + i * 0.08, top + 0.07, 0.02, 0.045, ['#e2453a', '#e88a2a', '#9cc24e'][i], { geo: GEO.ball6, ink: 0.003 });
      k.cyl(w * 0.22, top, 0, 0.17, 0.2, '#c9783a', { geo: GEO.cyl16, ink: 0.005 }); k.cyl(w * 0.22, top + 0.2, 0, 0.175, 0.02, '#a35e2a', { geo: GEO.cyl16, ink: 0.003 });
      K.loafAt(k, w * 0.38, top, 0.24, 0.1, 0.4); K.jarAt(k, -w * 0.4, top, -0.2, room.R);
      room.steam.push(k.world(w * 0.22, top + 0.3, 0));
      return { hw: w / 2, hd: 0.38, h: 1.0, look: 'w.table', lookY: 1.2, feat: 'table' };
    },
    // a bookbinder's press, stacks of books, a glue pot
    bookPress(k, o, room) {
      k.box(0, 0.72, 0, 1.0, 0.05, 0.55, room.P.wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.43, 0, sz * 0.2, 0.05, 0.7, 0.05, shade(room.P.wood, 0.8), { ink: 0.004 });
      for (const s of [-1, 1]) k.post(-0.2 + s * 0.16, 0.745, 0, 0.05, 0.4, 0.05, '#3a3436', { ink: 0.002 }); k.box(-0.2, 1.1, 0, 0.42, 0.06, 0.2, '#3a3436'); k.cyl(-0.2, 1.13, 0, 0.02, 0.25, '#9aa0ad', { geo: GEO.cyl6, ink: 0 });
      for (let i = 0; i < 4; i++) k.box(-0.2, 0.77 + i * 0.05, 0, 0.28, 0.045, 0.2, BRIGHT[i], { ink: 0.002 });
      for (let i = 0; i < 5; i++) book(k, 0.3, 0.745 + i * 0.05, 0.05, BRIGHT[(i + 3) % 8], i * 0.15);
      k.cyl(0.3, 0.745, -0.18, 0.06, 0.08, '#c9784a', { geo: GEO.cyl8, ink: 0.003 });
      return { hw: 0.5, hd: 0.3, h: 1.2, look: 'w.book', lookY: 1.3 };
    },
    // a violin on its stand, a bow beside it
    violin(k) {
      k.beam(-0.1, 0, 0.1, 0, 0.35, 0, 0.02, INK, { ink: 0 }).beam(0.1, 0, 0.1, 0, 0.35, 0, 0.02, INK, { ink: 0 }).beam(0, 0, -0.12, 0, 0.35, 0, 0.02, INK, { ink: 0 });
      k.ball(0, 0.45, 0.02, 0.12, '#a8592f', { ry2: 0.16, rz2: 0.05, rx: -0.15 }); k.ball(0, 0.64, -0.01, 0.1, '#a8592f', { ry2: 0.1, rz2: 0.05, rx: -0.15 });
      k.beam(0, 0.7, -0.03, 0, 1.0, -0.08, 0.035, '#3a2a22', { t2: 0.02 }); k.ball(0, 1.03, -0.09, 0.035, '#3a2a22', { ink: 0.002 });
      k.beam(0.18, 0.02, 0.05, 0.12, 0.85, -0.02, 0.012, '#d8b080', { ink: 0 });
      return { r: 0.22, h: 1.05, look: null };
    },
    // keys hanging on a board (a wall)
    keyBoard(k) {
      k.box(0, 0, 0.02, 0.9, 0.6, 0.03, '#8a5f3e', { ink: 0.004 });
      for (let i = 0; i < 10; i++) { const x = -0.36 + (i % 5) * 0.18, y = 0.15 - Math.floor(i / 5) * 0.3; k.ball(x, y + 0.08, 0.05, 0.015, '#3a3436', { ink: 0 }); k.add(GEO.thin, x, y, 0.06, 0.04, 0.04, 0.04, i % 3 ? W8.brass : '#9aa0ad', { ink: 0 }); k.box(x, y - 0.08, 0.06, 0.015, 0.1, 0.01, i % 3 ? W8.brass : '#9aa0ad', { ink: 0 }); }
      return { look: null };
    },
    // a stack of cheese wheels on boards
    cheeses(k) {
      for (let i = 0; i < 3; i++) { k.box(0, 0.02 + i * 0.32, 0, 0.8, 0.04, 0.45, '#a8703f', { ink: 0.003 }); for (let j = 0; j < 2; j++) k.cyl(-0.18 + j * 0.36, 0.04 + i * 0.32, 0, 0.17, 0.14, i === 1 && j ? '#e8d070' : '#f2c14e', { geo: GEO.cyl16, ink: 0.004 }); }
      for (const s of [-1, 1]) k.post(s * 0.38, 0, 0, 0.04, 0.95, 0.4, '#8a5f3e', { ink: 0.003 });
      return { hw: 0.42, hd: 0.25, h: 1.0, look: null };
    },
    // a tall plant (or several), for corners
    plants(k, o, room) { K.plantAt(k, 0, 0, 0, 1.1, room.R, { tall: true }); K.plantAt(k, 0.38, 0, 0.2, 0.7, room.R, { flowers: true }); room.feats.add('plants'); return { r: 0.42, h: 1.6, look: null }; },
  };
  // a plant hanging from the ceiling, its leaves trailing
  function hangPlant(room, x, z, y) {
    const k = room.kit; k.frame(x, 0, z, 0, 0);
    k.cyl(0, y + 0.3, 0, 0.008, room.WH + 1.5 - y, INK, { geo: GEO.cyl6, ink: 0, ns: 1 });
    k.cyl(0, y, 0, 0.16, 0.18, '#c46a3a', { geo: GEO.bowl, ink: 0.005 });
    for (let i = 0; i < 7; i++) { const a = i * 0.9; k.add(GEO.ico1, Math.cos(a) * 0.14, y + 0.12 - (i % 3) * 0.12, Math.sin(a) * 0.14, 0.09, 0.12, 0.09, ['#4f9a45', '#5fae4f', '#6ab653'][i % 3]); }
    room.feats.add('plants');
  }
  Object.assign(F, { hangPlant, book, mug, pot, yarn, flowerBunch, frameDecal });
  return { F, F0, K, BRIGHT, PI };
})();
