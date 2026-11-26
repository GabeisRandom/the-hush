'use strict';
// DIARY: Noa's diary (DESIGN.md 15.4). One page in each region, 1 to 5, pinned to a little post near where her story already
// goes (her notebook pages in the forest and at each bell are story.js's and the dungeons', untouched). Written in the
// language and in the past tense, a band harder each region: her trip told as it happened, input for the Past realm before it
// asks you to produce the past. Read on the spot (READER.page, in the diary's paper), then a question; collected in the
// journal's Reading page, where you can read them again. A page shows once you could have got there (SPOTS[n].need).
//   DIARY.init(game) · .outdoor(dt, t, you) (READ.update) · .read(id, o) · .mapMarks(dpr) · .SPOTS · ._ (tests)

const DIARY = (() => {
  // where the pages are (outdoors, on open ground; checked in the game) and when each one appears
  const SPOTS = {
    1: { x: 166.4, z: -146.4, place: 'Molinar', need: s => !!s.flags.boulder || (s.flags.bells || 0) >= 1 },          // on the verge outside Molinar's west gate («Hoy llegué a Molinar»; just outside story.js's 6-unit arrival zone)
    2: { x: -134.0, z: -146.4, place: 'Remanso', need: s => !!s.flags.millFree || (s.flags.bells || 0) >= 1 },        // by Remanso's village sign, at the way in («Llegué a Remanso al mediodía…»; outside the arrival zone)
    3: { x: 97.6, z: -260.4, place: 'the Miners’ Camp', need: s => (s.flags.bells || 0) >= 2 },                      // by the camp's canteen
    4: { x: 202.2, z: -78.2, place: 'the Bloom Gardens', need: s => (s.flags.bells || 0) >= 3 },                     // by the green, south of the marquee (clear of Melisa and the judges)
    5: { x: 199.8, z: -252.8, place: 'Escarcha', need: s => (s.flags.bells || 0) >= 4 },                             // in the clockmakers' village
  };
  let G = null;
  const posts = {};
  const on = () => READ.on('diary');
  const pages = () => READ.list('diary');
  const pageFor = n => pages().find(d => d.region === n) || null;
  function pageTex() {
    return ZHF.canvasTex(128, 160, c => {
      c.fillStyle = '#efe8ff'; c.fillRect(0, 0, 128, 160);
      c.strokeStyle = 'rgba(90,90,170,.35)'; c.lineWidth = 2; for (let y = 30; y < 150; y += 14) { c.beginPath(); c.moveTo(10, y); c.lineTo(118, y); c.stroke(); }
      c.strokeStyle = 'rgba(44,43,74,.75)'; c.lineWidth = 2.5; for (let y = 27; y < 120; y += 14) { c.beginPath(); c.moveTo(14, y); for (let x = 14; x < 104 - (y % 28); x += 6) c.lineTo(x + 3, y - (x % 12 ? 2 : -1)); c.stroke(); }
      c.fillStyle = '#e86a8a'; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; c.beginPath(); c.arc(100 + Math.cos(a) * 7, 136 + Math.sin(a) * 7, 5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#ffd96b'; c.beginPath(); c.arc(100, 136, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#7a4ab0'; c.fillRect(56, 0, 16, 12);
      c.fillStyle = '#2c2b4a'; c.font = 'italic 700 20px "Segoe Print", "Ink Free", cursive'; c.fillText('N.', 18, 146);
    });
  }
  let TEX = null;
  function buildPost(n) {
    const sp = SPOTS[n]; if (!sp || typeof ZHF === 'undefined') return null;
    const g = new THREE.Group(); g.name = 'diary-' + n;
    const y = WORLD.terrainAt(sp.x, sp.z);
    g.position.set(sp.x, y, sp.z); G.w3d.scene.add(g);
    const k = ZHF.Kit();
    k.box(0, 0.62, 0, 0.14, 1.24, 0.14, '#7a5236').box(0, 1.27, 0, 0.2, 0.06, 0.2, '#5a3a22');
    k.add(ZHF.GEO.ball, '#7a4ab0', 0.0, 1.22, 0.11, 0.035, 0.035, 0.02, 0, 0, 0, { ink: 0 });
    ZHF.bake(g, k);
    if (!TEX) TEX = pageTex();
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.55), new THREE.MeshBasicMaterial({ map: TEX, side: THREE.DoubleSide }));
    sheet.position.set(0, 0.98, 0.085); sheet.rotation.z = -0.06; g.add(sheet);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#d9c4ff', transparent: true, opacity: 0.4, depthWrite: false })); glow.scale.setScalar(1.3); glow.position.set(0, 1.0, 0.16); g.add(glow);
    return { g, glow, sheet, solid: { x: sp.x, z: sp.z, r: 0.2, diary: true } };
  }
  const visible = n => {
    const s = G && G.state; if (!s || !s.flags.hatched || !on()) return false;
    const sp = SPOTS[n], d = pageFor(n);
    return !!(sp && d && sp.need(s));
  };
  function outdoor(dt, t, you) {
    if (!G) return;
    const Y = G.sim.you, inRoom = !!(G.indoors && G.indoors()), st = READ.S().diary;
    for (const n of Object.keys(SPOTS)) {
      const sp = SPOTS[n], show = visible(+n) && !inRoom && Math.hypot(sp.x - Y.x, sp.z - Y.z) < 170;
      let P = posts[n];
      if (!P && !show) continue;
      if (!P) { try { P = posts[n] = buildPost(+n) || { broken: true }; } catch (e) { console.error('[diary]', e); P = posts[n] = { broken: true }; } }
      if (P.broken) continue;
      P.g.visible = show;
      if (!WORLD.extra.includes(P.solid)) WORLD.extra.push(P.solid);
      P.solid.x = show ? sp.x : 1e5; P.solid.z = show ? sp.z : 1e5;
      if (!show) continue;
      const d = pageFor(+n), read = d && st[d.id];
      P.glow.material.opacity = read ? 0 : 0.32 + 0.2 * Math.sin(t * 3 + +n);
      P.g.rotation.y = dampAngle(P.g.rotation.y, Math.atan2(Y.x - sp.x, Y.z - sp.z), 1.5, dt);      // (the page turns slowly to face you, like a sign)
    }
  }
  const PROVIDER = {
    interactables() {
      if (!G || !on()) return [];
      const out = [], st = READ.S().diary;
      for (const n of Object.keys(SPOTS)) {
        if (!visible(+n) || !posts[n] || posts[n].broken) continue;
        const sp = SPOTS[n], d = pageFor(+n);
        out.push({ x: sp.x, z: sp.z, r: 2.2, label: st[d.id] ? 'Read again' : 'Read', run: () => read(d.id) });
      }
      return out;
    },
  };
  async function read(id, o = {}) {
    const d = pages().find(x => x.id === id) || READ.find('diary', id); if (!d) return null;
    const st = READ.S().diary, first = !st[d.id];
    if (typeof Sound !== 'undefined') try { Sound.play('page'); } catch (e) { /* */ }
    const r = READ.record('diary', d.id); if (first) r.found = Date.now();
    r.n = (r.n || 0) + 1;
    READ.save();
    if (first && !o.from) UI.toast(`Noa’s diary: a page! (${Object.keys(st).filter(k => pages().some(p => p.id === k)).length}/${pages().length})`);
    const res = await READER.page(d, { diary: true, kind: `Noa’s diary · ${d.place || (SPOTS[d.region] || {}).place || ''}` });
    if (res && res.grades) r.grades = (r.grades || []).concat(res.grades.filter(Boolean)).slice(-8);
    READ.save();
    return res;
  }
  // the mini-map: a lilac page by each one you haven't read yet
  const MARK = {};
  function mapMarks(dpr) {
    if (!G || !on()) return [];
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 14; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#efe8ff'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.1; c.beginPath(); c.rect(3, 1.5, 8.5, 11); c.fill(); c.stroke();
      c.strokeStyle = '#7a4ab0'; c.lineWidth = 1; for (const y of [4.5, 7, 9.5]) { c.beginPath(); c.moveTo(4.6, y); c.lineTo(10, y); c.stroke(); }
      MARK[k] = cv;
    }
    const st = READ.S().diary, out = [];
    for (const n of Object.keys(SPOTS)) { const d = pageFor(+n); if (!d || st[d.id] || !visible(+n)) continue; out.push({ x: SPOTS[n].x, z: SPOTS[n].z, img: MARK[k] }); }
    return out;
  }
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
  }
  return { init, outdoor, read, mapMarks, SPOTS, _: { posts, visible, pageFor, buildPost } };
})();
