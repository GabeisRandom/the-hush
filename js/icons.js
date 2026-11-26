'use strict';
// Little paper-cutout pictures for words (teach box, journal, Noa's pages). Same rule as the
// cutouts the user liked: a paper-white border, flat color, one thin ink outline.

const ICONS = (() => {
  const INK = '#2b2235', PAPER = '#fffaf0';
  const ell = (x, y, rx, ry, rot = 0) => c => c.ellipse(x, y, rx, ry, rot, 0, TAU);
  const poly = pts => c => { c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.closePath(); };
  const rr = (x, y, w, h, r) => c => { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  function shape(c, pass, path, fill, lw = 2.2) {
    c.beginPath(); path(c);
    if (pass === 0) { c.lineWidth = lw + 7; c.strokeStyle = PAPER; c.fillStyle = PAPER; c.stroke(); c.fill(); return; }
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
  }
  const dot = (c, x, y, r, col) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); };
  const eyes = (c, x1, x2, y, s = 1) => [x1, x2].forEach(x => { dot(c, x, y, 3.2 * s, INK); dot(c, x + 1, y - 1.2, 1.1 * s, '#fff'); });
  const DRAW = {
    wave(c, p) { shape(c, p, ell(0, 0, 22, 26), '#f5cda2'); [-14, -5, 4, 13].forEach((x, i) => shape(c, p, rr(x - 4, -40 + Math.abs(i - 1.5) * 3, 8, 22, 4), '#f5cda2')); },
    tree(c, p) { shape(c, p, poly([[-6, 34], [-4, 0], [4, 0], [6, 34]]), '#8a5f3e'); [[-14, -6, 16], [14, -8, 16], [0, -22, 20], [0, -4, 18]].forEach(([x, y, r]) => shape(c, p, ell(x, y, r, r), '#5aa84a')); if (p) dot(c, -6, -26, 5, 'rgba(255,255,255,0.35)'); },
    flower(c, p) { shape(c, p, rr(-2, -4, 4, 38, 2), '#3f8a3a'); shape(c, p, ell(9, 18, 9, 4, -0.5), '#4c9a40'); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; shape(c, p, ell(Math.cos(a) * 12, -14 + Math.sin(a) * 12, 9, 9), '#ffd84a'); } shape(c, p, ell(0, -14, 7, 7), '#e0743c'); },
    water(c, p) { shape(c, p, c => { c.moveTo(0, -34); c.bezierCurveTo(14, -12, 24, 4, 24, 14); c.arc(0, 14, 24, 0, Math.PI); c.bezierCurveTo(-24, 4, -14, -12, 0, -34); c.closePath(); }, '#4aa8d8'); if (p) dot(c, -9, 8, 5, 'rgba(255,255,255,0.6)'); },
    train(c, p) { shape(c, p, rr(-30, -14, 44, 26, 5), '#2f7f78'); shape(c, p, rr(-30, -32, 20, 20, 3), '#2f7f78'); shape(c, p, rr(14, -10, 18, 22, 4), '#e0503f'); shape(c, p, rr(18, -24, 8, 14, 2), INK); [-20, -2, 20].forEach(x => shape(c, p, ell(x, 16, 7, 7), INK)); if (p) shape(c, 1, rr(-26, -28, 12, 10, 2), '#a8e1f0', 1.5); },
    stone(c, p) { shape(c, p, poly([[-30, 16], [-24, -8], [-6, -20], [16, -18], [30, -2], [28, 16]]), '#a3a196'); if (p) { c.beginPath(); c.moveTo(4, -6); c.lineTo(-4, 4); c.lineTo(2, 12); c.lineWidth = 1.6; c.strokeStyle = 'rgba(43,34,53,0.5)'; c.stroke(); dot(c, -12, -8, 5, 'rgba(255,255,255,0.4)'); } },
    mushroom(c, p) { shape(c, p, rr(-8, -4, 16, 32, 6), '#f3ead6'); shape(c, p, c => { c.moveTo(-30, 0); c.bezierCurveTo(-30, -36, 30, -36, 30, 0); c.closePath(); }, '#d9493b'); if (p) [[-14, -12, 5], [6, -20, 4], [16, -8, 4]].forEach(([x, y, r]) => dot(c, x, y, r, '#fff6e6')); },
    fox(c, p) { shape(c, p, ell(14, 18, 22, 10, -0.3), '#e0743c'); shape(c, p, poly([[-26, -26], [-18, -4], [-30, -2]]), '#e0743c'); shape(c, p, poly([[-2, -26], [-6, -4], [6, -6]]), '#e0743c'); shape(c, p, poly([[-30, -6], [8, -6], [-10, 18]]), '#e0743c'); shape(c, p, poly([[-22, 6], [0, 6], [-10, 18]]), '#fffaf0', 1.6); if (p) { eyes(c, -18, -2, -2, 0.8); dot(c, -10, 16, 3, INK); } },
    bird(c, p) { shape(c, p, ell(0, 4, 24, 18), '#5aa0d8'); shape(c, p, ell(-6, 8, 13, 9, 0.4), '#3f7fc9'); shape(c, p, poly([[22, -2], [36, 2], [22, 8]]), '#f2b84a'); if (p) eyes(c, 10, 10, -4); },
    bridge(c, p) { shape(c, p, c => { c.moveTo(-34, 14); c.quadraticCurveTo(0, -18, 34, 14); c.lineTo(34, 22); c.quadraticCurveTo(0, -8, -34, 22); c.closePath(); }, '#a8673a'); [-22, -8, 8, 22].forEach(x => shape(c, p, rr(x - 3, -10 + Math.abs(x) * 0.4, 6, 14, 2), '#c79d6d', 1.6)); },
    star(c, p) { shape(c, p, c => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 15 : 34; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }, '#ffcf3f'); if (p) eyes(c, -7, 7, -2, 0.8); },
    apple(c, p) { shape(c, p, c => { c.moveTo(0, -18); c.bezierCurveTo(-30, -32, -38, 6, -12, 26); c.quadraticCurveTo(0, 32, 12, 26); c.bezierCurveTo(38, 6, 30, -32, 0, -18); c.closePath(); }, '#e2483a'); shape(c, p, ell(10, -28, 9, 5, -0.5), '#5cb04c'); if (p) { c.beginPath(); c.moveTo(0, -16); c.lineTo(-2, -30); c.lineWidth = 3; c.strokeStyle = '#5b3a22'; c.stroke(); dot(c, -14, -6, 5, '#ffb3a6'); } },
    house(c, p) { shape(c, p, rr(-24, -6, 48, 36, 3), '#f3e8d2'); shape(c, p, poly([[-32, -4], [0, -32], [32, -4]]), '#c9553f'); shape(c, p, rr(-6, 10, 12, 20, 3), '#8d5733', 1.6); shape(c, p, rr(10, 2, 10, 10, 2), '#83c7e2', 1.6); },
    letter(c, p) { shape(c, p, rr(-30, -20, 60, 40, 4), '#fffaf0'); if (p) { c.beginPath(); c.moveTo(-30, -20); c.lineTo(0, 4); c.lineTo(30, -20); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); dot(c, 0, 4, 5, '#e05a4b'); } },
    tower(c, p) { shape(c, p, poly([[-14, 34], [-12, -16], [12, -16], [14, 34]]), '#cfc6b8'); shape(c, p, poly([[-20, -14], [0, -40], [20, -14]]), '#8a5ab0'); if (p) { shape(c, 1, rr(-5, -6, 10, 14, 5), '#2b2235', 1.4); shape(c, 1, rr(-5, 14, 10, 10, 4), '#2b2235', 1.4); } },
    bread(c, p) { shape(c, p, c => { c.moveTo(-32, 12); c.bezierCurveTo(-34, -24, 34, -24, 32, 12); c.closePath(); }, '#d9a35a'); if (p) [-14, 0, 14].forEach(x => { c.beginPath(); c.moveTo(x - 4, -8); c.lineTo(x + 4, 2); c.lineWidth = 2; c.strokeStyle = '#a8673a'; c.stroke(); }); },
    // verbs: a little round someone doing the thing
    push(c, p) {
      shape(c, p, rr(4, -22, 30, 44, 4), '#b07a48'); if (p) [[8, -8, 26, -8], [8, 8, 26, 8]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineWidth = 1.6; c.strokeStyle = 'rgba(43,34,53,0.45)'; c.stroke(); });
      shape(c, p, ell(-14, 6, 13, 15, 0.5), '#ffd84a'); shape(c, p, ell(-24, -14, 10, 10), '#f5cda2'); shape(c, p, rr(-6, -4, 12, 7, 3), '#f5cda2');
      if (p) { [[-40, -10], [-42, 4], [-38, 16]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); }); dot(c, -21, -16, 2.2, INK); }
    },
    jump(c, p) {
      if (p) { c.beginPath(); c.moveTo(-34, 30); c.lineTo(34, 30); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); c.setLineDash([4, 5]); c.beginPath(); c.moveTo(-30, 26); c.quadraticCurveTo(-8, -34, 22, 22); c.stroke(); c.setLineDash([]); }
      shape(c, p, ell(0, -8, 14, 16), '#ffd84a'); shape(c, p, ell(0, -28, 10, 10), '#f5cda2'); if (p) dot(c, 3, -29, 2.2, INK);
    },
    hit(c, p) {
      shape(c, p, c => { for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, r = i % 2 ? 16 : 34; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); }, '#ffcf3f');
      shape(c, p, rr(-12, -10, 24, 20, 8), '#f5cda2'); if (p) [-5, 1, 7].forEach(x => { c.beginPath(); c.moveTo(x, -10); c.lineTo(x, -2); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); });
    },
    swim(c, p) {     // someone round, swimming in the waves
      shape(c, p, ell(-2, -6, 13, 13), '#f5cda2'); if (p) { dot(c, 2, -8, 2.2, INK); }
      shape(c, p, ell(17, 4, 10, 5, -0.6), '#f5cda2'); shape(c, p, ell(-20, 6, 9, 5, 0.6), '#f5cda2');
      shape(c, p, c => { c.moveTo(-36, 10); for (let i = 0; i < 6; i++) c.quadraticCurveTo(-30 + i * 12, i % 2 ? 2 : 18, -24 + i * 12, 10); c.lineTo(36, 30); c.lineTo(-36, 30); c.closePath(); }, '#4aa8d8');
      if (p) [[-18, 20], [8, 22]].forEach(([x, y]) => dot(c, x, y, 3, 'rgba(255,255,255,0.7)'));
    },
    eat(c, p) {      // an apple with a bite out of it
      shape(c, p, c => { c.moveTo(0, -18); c.bezierCurveTo(-30, -32, -38, 6, -12, 26); c.quadraticCurveTo(0, 32, 12, 26); c.bezierCurveTo(24, 18, 30, 8, 26, -2); c.arc(24, -8, 9, 1.4, 4.6, true); c.bezierCurveTo(22, -24, 10, -24, 0, -18); c.closePath(); }, '#e2483a');
      shape(c, p, ell(8, -28, 9, 5, -0.5), '#5cb04c');
      if (p) { c.beginPath(); c.moveTo(0, -16); c.lineTo(-2, -30); c.lineWidth = 3; c.strokeStyle = '#5b3a22'; c.stroke(); dot(c, -14, -6, 5, '#ffb3a6'); }
    },
    throw(c, p) {
      if (p) { c.setLineDash([5, 5]); c.beginPath(); c.moveTo(-34, 22); c.quadraticCurveTo(-4, -34, 22, -6); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); c.setLineDash([]); }
      shape(c, p, poly([[14, -14], [30, -12], [34, 2], [22, 8], [10, 2]]), '#a3a196');
      if (p) [[-6, -16], [-12, -6]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 3); c.lineWidth = 2; c.strokeStyle = 'rgba(43,34,53,0.5)'; c.stroke(); });
    },
  };
  // the drawing helpers, for icons added from other files
  const H = { shape, ell, poly, rr, dot, eyes, INK, PAPER };
  function draw(cv, key) {
    const c = cv.getContext('2d'), s = cv.width / 100;
    c.clearRect(0, 0, cv.width, cv.height);
    c.save(); c.setTransform(s, 0, 0, s, cv.width / 2, cv.height / 2 + 2 * s); c.lineJoin = c.lineCap = 'round';
    const d = DRAW[key] || DRAW.star;
    d(c, 0, H); d(c, 1, H);
    c.restore();
    return cv;
  }
  function canvas(key, size = 96) { const cv = document.createElement('canvas'); cv.width = cv.height = size; return draw(cv, key); }
  // Other files add their own icons: ICONS.add('cheese', (c, pass, h) => { h.shape(c, pass, h.ell(0, 0, 20, 14), '#f2c14e'); })
  // (drawn twice: pass 0 is the paper-white border, pass 1 the colors and ink, in a 100×100 box centered on 0,0)
  function add(key, fn) { DRAW[key] = fn; }
  return { draw, canvas, add, H, get keys() { return Object.keys(DRAW); } };
})();
